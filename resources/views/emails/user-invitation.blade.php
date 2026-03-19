<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to {{ $company->company_name ?? 'TradePulser' }}</title>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
        }
        .wrapper {
            width: 100%;
            table-layout: fixed;
            background-color: #f8fafc;
            padding-bottom: 40px;
        }
        .main {
            background-color: #ffffff;
            margin: 0 auto;
            width: 100%;
            max-width: 600px;
            border-spacing: 0;
            color: #1e293b;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .header {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            padding: 40px 20px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            font-size: 28px;
            font-weight: 800;
            margin: 0;
            letter-spacing: -0.025em;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 20px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 16px;
        }
        .message {
            font-size: 16px;
            line-height: 1.6;
            color: #475569;
            margin-bottom: 30px;
        }
        .details-card {
            background-color: #f1f5f9;
            border-radius: 8px;
            padding: 24px;
            margin-bottom: 30px;
            border: 1px solid #e2e8f0;
        }
        .details-title {
            font-size: 14px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 12px;
        }
        .details-item {
            margin-bottom: 8px;
            font-size: 15px;
        }
        .details-label {
            font-weight: 600;
            color: #334155;
        }
        .details-value {
            color: #1e293b;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        }
        .button-container {
            text-align: center;
            margin-bottom: 30px;
        }
        .button {
            display: inline-block;
            background-color: #2563eb;
            color: #ffffff !important;
            padding: 16px 32px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 700;
            font-size: 16px;
            box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
            transition: background-color 0.2s;
        }
        .footer {
            padding: 24px;
            text-align: center;
            font-size: 14px;
            color: #94a3b8;
        }
        .footer p {
            margin: 4px 0;
        }
        @media only screen and (max-width: 600px) {
            .content { padding: 30px 20px; }
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <center>
            <table class="main">
                <tr>
                    <td class="header">
                        <h1>TradePulser</h1>
                    </td>
                </tr>
                <tr>
                    <td class="content">
                        <div class="greeting">Welcome to {{ $company->company_name ?? 'the team' }}!</div>
                        <div class="message">
                            Hello {{ $user->name }},<br><br>
                            You've been invited to join <strong>{{ $company->company_name ?? 'TradePulser' }}</strong>. We're excited to have you on board! Your workspace is ready and waiting for you.
                        </div>

                        <div class="details-card">
                            <div class="details-title">Your Account Details</div>
                            <div class="details-item">
                                <span class="details-label">Login Email:</span>
                                <span class="details-value">{{ $user->email }}</span>
                            </div>
                            <div class="details-item">
                                <span class="details-label">Temporary Password:</span>
                                <span class="details-value">{{ $tempPassword }}</span>
                            </div>
                        </div>

                        <div class="button-container">
                            <a href="{{ url('/login') }}" class="button">Accept Invitation & Log In</a>
                        </div>

                        <div class="message" style="font-size: 14px; margin-bottom: 0;">
                            <em>* For security reasons, please change your password immediately after your first login.</em>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td class="footer">
                        <p>&copy; {{ date('Y') }} {{ $company->company_name ?? 'TradePulser' }}. All rights reserved.</p>
                        <p>If you have any questions, reach out to your administrator.</p>
                    </td>
                </tr>
            </table>
        </center>
    </div>
</body>
</html>
