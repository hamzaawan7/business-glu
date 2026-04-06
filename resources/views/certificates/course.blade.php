<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page {
            size: 297mm 210mm;
            margin: 0;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            margin: 0;
            padding: 0;
        }
    </style>
</head>
<body>
    {{-- Outermost table = Navy border --}}
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1B2A4A; height: 210mm;">
        <tr>
            <td style="padding: 7px; vertical-align: middle;">

                {{-- White panel --}}
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; height: 206mm;">
                    <tr>
                        <td style="padding: 6px; vertical-align: middle;">

                            {{-- Gold outer border --}}
                            <table width="100%" cellpadding="0" cellspacing="0" style="border: 2px solid #C5A55A;">
                                <tr>
                                    <td style="padding: 6px;">

                                        {{-- Gold inner border --}}
                                        <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #C5A55A;">
                                            <tr>
                                                <td style="padding: 24px 50px 16px 50px; text-align: center;">

                                                    {{-- Top decorative gold lines --}}
                                                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 8px;">
                                                        <tr>
                                                            <td style="width: 60px; border-bottom: 2px solid #C5A55A; font-size: 1px;">&nbsp;</td>
                                                            <td>&nbsp;</td>
                                                            <td style="width: 60px; border-bottom: 2px solid #C5A55A; font-size: 1px;">&nbsp;</td>
                                                        </tr>
                                                    </table>

                                                    {{-- Title --}}
                                                    <div style="font-size: 42px; font-weight: bold; color: #1B2A4A; text-transform: uppercase; letter-spacing: 6px; margin-bottom: 2px;">Certificate</div>
                                                    <div style="font-size: 15px; color: #C5A55A; text-transform: uppercase; letter-spacing: 8px; margin-bottom: 14px;">of Completion</div>

                                                    {{-- Gold divider --}}
                                                    <table cellpadding="0" cellspacing="0" style="margin: 0 auto 16px auto;">
                                                        <tr>
                                                            <td style="width: 60px; border-bottom: 2px solid #C5A55A; font-size: 1px;">&nbsp;</td>
                                                        </tr>
                                                    </table>

                                                    {{-- Presented to --}}
                                                    <div style="font-size: 10px; color: #8899aa; text-transform: uppercase; letter-spacing: 4px; margin-bottom: 4px;">This is proudly presented to</div>

                                                    {{-- Recipient name --}}
                                                    <div style="font-size: 32px; font-weight: bold; color: #1B2A4A; font-style: italic; margin-bottom: 4px;">{{ $userName }}</div>

                                                    {{-- Gold line under name --}}
                                                    <table cellpadding="0" cellspacing="0" style="margin: 0 auto 14px auto;">
                                                        <tr>
                                                            <td style="width: 120px; border-bottom: 2px solid #C5A55A; font-size: 1px;">&nbsp;</td>
                                                        </tr>
                                                    </table>

                                                    {{-- Body text --}}
                                                    <div style="font-size: 12px; color: #5a6a7a; line-height: 1.8; margin-bottom: 20px;">
                                                        For successfully completing the training course<br>
                                                        <strong style="color: #1B2A4A; font-style: italic;">&ldquo;{{ $courseTitle }}&rdquo;</strong><br>
                                                        on {{ \Carbon\Carbon::parse($completionDate)->format('F j, Y') }}
                                                    </div>

                                                    {{-- Footer: Date | Seal | Certificate --}}
                                                    <table width="80%" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                                                        <tr>
                                                            {{-- Date --}}
                                                            <td style="width: 35%; text-align: center; vertical-align: bottom; padding: 0 10px;">
                                                                <table width="100%" cellpadding="0" cellspacing="0">
                                                                    <tr><td style="text-align: center;"><div style="width: 120px; border-top: 1px solid #bcc8d4; margin: 0 auto 3px auto;"></div></td></tr>
                                                                    <tr><td style="text-align: center; font-size: 11px; font-weight: bold; color: #1B2A4A;">{{ \Carbon\Carbon::parse($completionDate)->format('M d, Y') }}</td></tr>
                                                                    <tr><td style="text-align: center; font-size: 7px; color: #8a95a5; text-transform: uppercase; letter-spacing: 2px;">Date of Completion</td></tr>
                                                                </table>
                                                            </td>

                                                            {{-- Seal --}}
                                                            <td style="width: 30%; text-align: center; vertical-align: middle;">
                                                                <table cellpadding="0" cellspacing="0" style="margin: 0 auto; background-color: #C5A55A; width: 56px;">
                                                                    <tr>
                                                                        <td style="padding: 4px; text-align: center;">
                                                                            <table cellpadding="0" cellspacing="0" style="margin: 0 auto; border: 2px solid #ffffff; width: 44px;">
                                                                                <tr>
                                                                                    <td style="text-align: center; padding: 8px 4px 3px 4px; color: #ffffff; font-size: 16px; font-weight: bold; letter-spacing: 2px;">BG</td>
                                                                                </tr>
                                                                                <tr>
                                                                                    <td style="text-align: center; padding: 0 4px 6px 4px; color: #ffffff; font-size: 5px; text-transform: uppercase; letter-spacing: 1px;">Certified</td>
                                                                                </tr>
                                                                            </table>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </td>

                                                            {{-- Certificate Number --}}
                                                            <td style="width: 35%; text-align: center; vertical-align: bottom; padding: 0 10px;">
                                                                <table width="100%" cellpadding="0" cellspacing="0">
                                                                    <tr><td style="text-align: center;"><div style="width: 120px; border-top: 1px solid #bcc8d4; margin: 0 auto 3px auto;"></div></td></tr>
                                                                    <tr><td style="text-align: center; font-size: 11px; font-weight: bold; color: #1B2A4A;">{{ $certNumber }}</td></tr>
                                                                    <tr><td style="text-align: center; font-size: 7px; color: #8a95a5; text-transform: uppercase; letter-spacing: 2px;">Certificate Number</td></tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </table>

                                                    {{-- Bottom decorative gold lines --}}
                                                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 12px;">
                                                        <tr>
                                                            <td style="width: 60px; border-bottom: 2px solid #C5A55A; font-size: 1px;">&nbsp;</td>
                                                            <td>&nbsp;</td>
                                                            <td style="width: 60px; border-bottom: 2px solid #C5A55A; font-size: 1px;">&nbsp;</td>
                                                        </tr>
                                                    </table>

                                                    {{-- Bottom credits --}}
                                                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 6px;">
                                                        <tr>
                                                            <td style="width: 30%; text-align: left; font-size: 6px; color: #b0b8c4; text-transform: uppercase; letter-spacing: 1px;">Issued by Business Glu</td>
                                                            <td style="width: 40%;"><div style="border-top: 1px solid #ddc87a;"></div></td>
                                                            <td style="width: 30%; text-align: right; font-size: 6px; color: #b0b8c4; text-transform: uppercase; letter-spacing: 1px;">{{ $certNumber }}</td>
                                                        </tr>
                                                    </table>

                                                </td>
                                            </tr>
                                        </table>

                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>
                </table>

            </td>
        </tr>
    </table>
</body>
</html>
