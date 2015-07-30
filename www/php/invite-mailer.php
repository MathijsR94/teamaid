<?php
namespace FireBase;
require 'class.phpmailer.php';
require 'autoload.php.dist';

require 'TokenGenerator.php';
require 'TokenException.php';
use Firebase\Token\TokenException;
use Firebase\Token\TokenGenerator;
use PHPMailer;

$params = json_decode(file_get_contents('php://input'), true);

$tomail = $params['Tomail'];
$userid = $params['UserID'];

try {
    $nextYear = time() + (60*60*24*365);
    $generator = new TokenGenerator('pV73qwlhDlHSnNYRCr3zwosIWKojxvMPvewrUZpD'); //This Firebase secret isn't valid anymore
    $token = $generator
        ->setOption('expires', $nextYear)
        ->setData(array('uid' => $userid . "server"))
        ->create();

    $mail = new PHPMailer();

    $mail->SetFrom('henk@lab49.nl');
    $mail->AddAddress($tomail);
    $mail->Subject = 'IFrame GreenBricks';
    $body = 'Beste,

    Hierbij een link om een aanvraagmodule op uw website te plaatsen.

    <iframe frameborder="0" width="300" height="200" src="http://gb1.lab49.nl/php/request-offer.php?auth=' .$token .'&location='.$userid.'"></iframe>

    Met vriendelijke groet,
    GreenBricks Support';
    $mail->Body = (string)$body;
//    $mail->IsHTML(true);
    if(!$mail->Send()) {
        echo "Mailer Error: " . $mail->ErrorInfo;
    } else {
        echo "Message sent!";
    }
}
catch (TokenException $e){
    echo "Error: " .$e.getMessage();
}
?>