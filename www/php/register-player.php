<?php

namespace FireBase;

require 'firebaseInterface.php';
require 'firebaseStub.php';
require 'firebaseLib.php';

use FireBase\FireBaseLib;
use FireBase\FireBaseInterface;
use FireBase\FireBaseStub;

if(isset($_POST['sm'])) {
    $token = $_GET['auth'];
    $location = $_GET['location'];
    $firstName = $_POST['vn'];
    $insertion = $_POST['tv'];
    $lastName = $_POST['an'];
    $residence = $_POST['wp'];
    $email = $_POST['em'];
    $tel = $_POST['tel'];

    $url = https://amber-torch-2058.firebaseio.com/';
    $path = '/Teams/'.$location;
    $data = array(
        "firstName" => $firstName,
        "insertion" => $insertion,
        "lastName" => $lastName,
        "residence" => $residence,
        "email" => $email,
        "telephoneNumber" => $tel,
        "status" => 0,
        "status0" => array(".sv" => "timestamp")
    );

    $firebase = new \Firebase\FirebaseLib($url, $token);
    $firebase->push($path, $data);

    echo 'Het is gelukt! Er wordt zo spoedig mogelijk contact met u opgenomen. Dank voor uw aanvraag!';
}
?>
<!DOCTYPE html>
<html>
<head lang="en">
    <meta charset="UTF-8">
    <title></title>
</head>
<body>
<?php if(!isset($_POST['sm'])) { ?>
<form method="post" action="">
    <table>
        <tr>
            <td>
                Voornaam:
            </td>
            <td>
                <input type="text" name="vn" required/>
            </td>
        </tr>
        <tr>
            <td>
                Tussenvoegsel:
            </td>
            <td>
                <input type="text" name="tv" />
            </td>
        </tr>
        <tr>
            <td>
                Achternaam:
            </td>
            <td>
                <input type="text" name="an" required/>
            </td>
        </tr>
        <tr>
            <td>
                Email:
            </td>
            <td>
                <input type="text" name="em" value="" required/>
            </td>
        </tr>
		<tr>
            <td>
                Password:
            </td>
            <td>
                <input type="password" name="pwd" required/>
            </td>
        </tr>
        <tr colspan="2">
            <td>
                <input name="sm" type="submit"/>
            </td>
        </tr>
    </table>
</form>

<?php } ?>



