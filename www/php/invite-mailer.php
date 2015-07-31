<?php
namespace FireBase;

require 'class.phpmailer.php';
require 'autoload.php.dist';

require 'TokenGenerator.php';
require 'TokenException.php';
include_once('FirebaseToken.php');
use Firebase\Token\TokenException;
use Firebase\Token\TokenGenerator;
use PHPMailer;
error_reporting(-1);
echo 'test';
//$params = json_decode(file_get_contents('php://input'), true);
//
//$tomail = $params['Tomail'];
//$teamId = $params['teamId'];
//$teamnaam = $params['teamName'];

//try {
    $nextYear = time() + (60*60*24*365);
    $generator = new TokenGenerator('onRdN22bDZ3622PLt6KKGHyHe3caLFNOaRfWEkPm'); //This Firebase secret isn't valid anymore
    $token = $generator
        ->setData(array('teamId' => '24'))
        ->create();

echo $token;
//        $token = $generator
////            ->setOption('expires', $nextYear)
//        ->setData(array('teamId' => $teamId))
//        ->create();}
//catch (TokenException $e){
//    echo "Error: " .$e.getMessage();
//}
//    mail($tomail, 'test', 'http://teamaid.nl/php/register-player.php?auth=&location=', 'From: info@teamaid.nl');
//    mail($tomail, "Titel", "Corvee hebben deze week corvee, Zie www.TeamAid.nl voor het rooster", "from: TeamAid.nl <info@TeamAid.nl>");

//    $mail = new PHPMailer();
//    $mail->SetFrom('info@TeamAid.nl');
//    $mail->AddAddress($tomail);
//    $mail->Subject = 'TeamAid Uitnodiging voor '.$teamnaam;
//    $body = 'Beste,
//
//    Hierbij een link om je aan te melden bij'.$teamnaam.'.
//
//    http://teamaid.nl/php/register-player.php?auth=' .$token .'&teamId='.$teamId.'
//
//    Met vriendelijke groet,
//    TeamAid.nl';
//    $mail->Body = (string)$body;
////    $mail->IsHTML(true);
//    if(!$mail->Send()) {
//        echo "Mailer Error: " . $mail->ErrorInfo;
//    } else {
//        echo "Message sent!";
//
//}
?>