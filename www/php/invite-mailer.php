<?php
namespace FireBase;

require 'class.phpmailer.php';
require 'autoload.php.dist';

// require 'TokenGenerator.php';
// require 'TokenException.php';

// use Firebase\Token\TokenException;
// use Firebase\Token\TokenGenerator;
use PHPMailer;

$params = json_decode(file_get_contents('php://input'), true);

$tomail = $params['Tomail'];
$teamId = $params['teamId'];
$teamnaam = $params['teamName'];
// $tomail = 'koen.zoon@gmail.com';//$params['Tomail'];
// $teamId = 'dfwsefijwhrfevbhk';//$params['teamId'];
// $teamnaam = 'prutsers en techniek';//$params['teamName'];

// try {
    // $nextYear = time() + (60*60*24*365);
    // $generator = new TokenGenerator('xxxxxxxxxxxxxxsecret'); //This Firebase secret isn't valid anymore
       // $token = $generator
       // ->setOption('expires', $nextYear)
       // ->setData(array('uid' => $teamId))
       // ->create();
// }
// catch (TokenException $e){
   // echo "Error: " .$e.getMessage();
// }

   $mail = new PHPMailer();
   $mail->SetFrom('info@TeamAid.nl');
   $mail->AddAddress($tomail);
   $mail->Subject = 'TeamAid Uitnodiging voor '.$teamnaam;
   $body = 'Beste,

   Je bent uitgenodigd voor '.$teamnaam.'!.

   registreer je op http://TeamAid.nl
   
   gebruik het volgende referentie nummer: '.$teamId.'

   Met vriendelijke groet,
   TeamAid.nl';
   
   $mail->Body = (string)$body;
//    $mail->IsHTML(true);
   if(!$mail->Send()) {
       echo "Mailer Error: " . $mail->ErrorInfo;
   } else {
       echo "Message sent!";

}
?>