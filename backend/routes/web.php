<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});




use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

Route::get('/test-phpmailer', function () {
    require base_path('vendor/autoload.php');

    $mail = new PHPMailer(true);

    try {
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'farahchettab2@gmail.com';
        $mail->Password   = 'ueoohaotzabnirwz';
        $mail->SMTPSecure = 'tls';
        $mail->Port       = 587;

        $mail->setFrom('farahchettab2@gmail.com', 'Test');
        $mail->addAddress('adresse_destination@gmail.com');

        $mail->Subject = 'Test PHPMailer';
        $mail->Body    = 'PHPMailer fonctionne !';

        $mail->send();
        return 'Email envoyé via PHPMailer !';

    } catch (Exception $e) {
        return "Erreur envoi email : {$mail->ErrorInfo}";
    }
});


Route::get('/test-mail', function () {
    try {
        \Illuminate\Support\Facades\Mail::raw('Test depuis Laravel !', function ($message) {
            $message->to('adresse_destination@gmail.com')
                    ->subject('Test Mail Laravel');
        });

        return 'Mail Laravel envoyé !';
    } catch (\Exception $e) {
        return 'Erreur : ' . $e->getMessage();
    }
});
