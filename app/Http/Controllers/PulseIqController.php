<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PulseIqConversation;
use App\Models\PulseIqMessage;
use App\Services\PulseIqService;
use Illuminate\Support\Facades\DB;
use Exception;

class PulseIqController extends Controller
{
    protected PulseIqService $pulseIqService;

    public function __construct(PulseIqService $pulseIqService)
    {
        $this->pulseIqService = $pulseIqService;
    }

    public function chat(Request $request)
    {
        $request->validate([
            'message' => 'required|string',
            'conversation_id' => 'nullable|exists:pulse_iq_conversations,id'
        ]);

        $user = auth()->user();
        $companyId = $user->company_id;
        $userMessage = $request->input('message');

        try {
            DB::beginTransaction();

            // 1. Get or Create Conversation
            $conversationId = $request->input('conversation_id');
            if ($conversationId) {
                $conversation = PulseIqConversation::where('id', $conversationId)
                    ->where('company_id', $companyId)
                    ->firstOrFail();
            } else {
                $conversation = PulseIqConversation::create([
                    'user_id' => $user->id,
                    'company_id' => $companyId,
                    'title' => substr($userMessage, 0, 50) . (strlen($userMessage) > 50 ? '...' : '')
                ]);
            }

            // 2. Build History for Gemini
            $dbMessages = PulseIqMessage::where('conversation_id', $conversation->id)->orderBy('id', 'asc')->get();
            $history = [];
            foreach ($dbMessages as $dbMsg) {
                // We only send 'user' and 'model' roles to Gemini. Tool executions aren't strictly needed for old history, 
                // but Gemini supports it. For simplicity, we just send text history.
                if (in_array($dbMsg->role, ['user', 'model'])) {
                    $history[] = [
                        'role' => $dbMsg->role,
                        'parts' => [['text' => $dbMsg->content]]
                    ];
                }
            }

            // Append new message to history array
            $history[] = [
                'role' => 'user',
                'parts' => [['text' => $userMessage]]
            ];

            // 3. Save User Message to DB
            PulseIqMessage::create([
                'conversation_id' => $conversation->id,
                'role' => 'user',
                'content' => $userMessage
            ]);

            // 4. Call AI Service
            $response = $this->pulseIqService->generateResponse($history, $companyId);
            $responseText = $response['text'];

            // 5. Save Model Response to DB
            PulseIqMessage::create([
                'conversation_id' => $conversation->id,
                'role' => 'model',
                'content' => $responseText
            ]);

            DB::commit();

            return response()->json([
                'conversation_id' => $conversation->id,
                'message' => $responseText
            ]);

        } catch (Exception $e) {
            DB::rollBack();
            
            \Illuminate\Support\Facades\Log::error('PulseIQ Chat Exception: ' . $e->getMessage());

            $friendlyMessage = "I'm experiencing high traffic or my connection to the intelligence network was interrupted. Please try again in a few moments.";
            
            if (str_contains(strtolower($e->getMessage()), '429') || str_contains(strtolower($e->getMessage()), 'quota')) {
                $friendlyMessage = "Google Gemini AI has hit its free-tier rate limit. Please wait about 15 seconds and try asking again!";
            }
            
            return response()->json([
                'conversation_id' => $conversationId ?? null,
                'message' => "⚠️ " . $friendlyMessage
            ], 200);
        }
    }

    public function getConversations()
    {
        $conversations = PulseIqConversation::where('user_id', auth()->id())
            ->orderBy('updated_at', 'desc')
            ->get(['id', 'title', 'updated_at']);

        return response()->json($conversations);
    }

    public function getMessages($id)
    {
        $conversation = PulseIqConversation::where('id', $id)
            ->where('user_id', auth()->id())
            ->firstOrFail();

        $messages = PulseIqMessage::where('conversation_id', $conversation->id)
            ->whereIn('role', ['user', 'model']) // Hide system/tool messages from UI
            ->orderBy('id', 'asc')
            ->get(['id', 'role', 'content', 'created_at']);

        return response()->json($messages);
    }
}
