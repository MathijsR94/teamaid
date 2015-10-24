<?php
/*
* Plugin Name: SportlinkScraper
* Description: Create your WordPress shortcode.
* Version: 1.0
* Author: InkThemes
* Author URI: http://inkthemes.com
*/
// Example 1 : WP Shortcode to display form on any page or post.

include('simple_html_dom.php');

function Scrape_Function($atts, $content = "")
{
    $sl_teamcode = types_render_field('sl_teamcode', array('output' => 'raw'));

    switch($atts['type']){
case "Verjaardagen":
    $url = 'http://bequick.slclubsite.nl/index.php?option=com_content&view=article&id=305&Itemid=179';
break;
case "teamContent":
    $url = 'http://bequick.slclubsite.nl/index.php?option=com_content&view=article&id=313&Itemid=179&teamcode='.$atts['team'].'&poulecode='.$atts['poule'];
break;
case "ProgrammaActual":
    $url = 'http://bequick.slclubsite.nl/index.php?option=com_content&view=article&id=314';
break;
case "Programma1wk":
    $url = 'http://bequick.slclubsite.nl/index.php?option=com_content&view=article&id=315';
break;
case "Programma2wk":
    $url = 'http://bequick.slclubsite.nl/index.php?option=com_content&view=article&id=316';
break;
case "Programma3wk":
    $url = 'http://bequick.slclubsite.nl/index.php?option=com_content&view=article&id=317';
break;
case "Programma4wk":
    $url = 'http://bequick.slclubsite.nl/index.php?option=com_content&view=article&id=318';
break;
case "Programma5wk":
    $url = 'http://bequick.slclubsite.nl/index.php?option=com_content&view=article&id=319';
break;
case "Programma6wk":
    $url = 'http://bequick.slclubsite.nl/index.php?option=com_content&view=article&id=320';
break;
case "UitlsagenActual":
    $url = 'http://bequick.slclubsite.nl/index.php?option=com_content&view=article&id=156&ItemId=179';
break;
case "Uitlsagen1wk":
    $url = 'http://bequick.slclubsite.nl/index.php?option=com_content&view=article&id=201&ItemId=179';
break;
case "Uitlsagen2wk":
    $url = 'http://bequick.slclubsite.nl/index.php?option=com_content&view=article&id=202&ItemId=179';
break;
case "Uitlsagen3wk":
    $url = 'http://bequick.slclubsite.nl/index.php?option=com_content&view=article&id=203&ItemId=179';
break;
default:
     $url  = "";
break;
}
    $html = file_get_html($url);
    $tables = $html->find('table');
    echo '<table>';
    foreach($tables[1]->find('tr') as $row) {
        echo '<tr>';
	foreach($row->find('th') as $data) {
            echo '<th>' . $data->plaintext . '</th>';
        }
        foreach($row->find('td') as $data) {
            echo '<td>' . $data->plaintext . '</td>';
        }
        echo '</tr>';
    }
    echo '</table>';
}

add_shortcode('scrape', 'Scrape_Function');
?>