<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AccountActivityNotification extends Notification
{
    use Queueable;

    protected $entity;
    protected $type; // 'created', 'approved', 'rejected'
    protected $initiatorName;

    /**
     * Create a new notification instance.
     */
    public function __construct($entity, $type, $initiatorName = null)
    {
        $this->entity = $entity;
        $this->type = $type;
        $this->initiatorName = $initiatorName ?: ($entity->creator->name ?? 'System');
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $entityName = class_basename($this->entity);
        $entityId = $this->entity->id;
        $entityNumber = $this->entity->voucher_number ?? $this->entity->invoice_number ?? $this->entity->id;

        $title = "";
        $message = "";

        if ($this->type === 'created') {
            $title = "New {$entityName} created";
            $message = "{$this->initiatorName} created {$entityName} #{$entityNumber} for approval.";
        } elseif ($this->type === 'approved') {
            $title = "{$entityName} Approved";
            $message = "Your {$entityName} #{$entityNumber} has been approved.";
        } elseif ($this->type === 'rejected') {
            $title = "{$entityName} Rejected";
            $reason = $this->entity->rejection_reason ? " Reason: " . $this->entity->rejection_reason : "";
            $message = "Your {$entityName} #{$entityNumber} was rejected.{$reason}";
        } elseif ($this->type === 'reversal_requested') {
            $title = "Reversal Requested: {$entityName}";
            $message = "{$this->initiatorName} is requesting a reversal for {$entityName} #{$entityNumber}. Reason: {$this->entity->reversal_reason}";
        } elseif ($this->type === 'reversal_approved') {
            $title = "Reversal Approved: {$entityName}";
            $message = "The reversal for your {$entityName} #{$entityNumber} has been approved.";
        } elseif ($this->type === 'reversal_rejected') {
            $title = "Reversal Rejected: {$entityName}";
            $message = "The reversal request for {$entityName} #{$entityNumber} was rejected.";
        }

        return [
            'title' => $title,
            'message' => $message,
            'entity_type' => strtolower($entityName),
            'entity_id' => $entityId,
            'entity_number' => $entityNumber,
            'action_type' => $this->type,
        ];
    }
}
