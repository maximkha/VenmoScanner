<?php
//https://venmo.com/Keaton-Eckhoff
$ret = array();
if (!isset($_GET["user"]))
{
    $ret["error"] = true;
    echo json_encode($ret);
    exit();
}

$ret["error"] = false;

$url = "https://venmo.com/" . $_GET["user"];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
$content = curl_exec($ch);
//var_dump(curl_error($ch));
curl_close($ch);
//var_dump($content);
//return;
//$content = file_get_contents();
$doc = new DOMDocument();
libxml_use_internal_errors(true);
$doc->loadHTML($content);
$xpath = new DOMXPath($doc);
$displayName = $xpath->query("//div[@class=\"profile-badge-name\"]/text()")->item(0);
$dispName = substr(substr($displayName->textContent,0,-2),13);
$ret["displayName"] = $dispName;
$ret["url"] = $_GET["user"];
$urls = $xpath->query("(//div[@class=\"paymentpage-subline\"]/a[1])[@href=\"/".$_GET["user"]."\"]/../a[2]/@href");
$displayNames = $xpath->query("(//div[@class=\"paymentpage-subline\"]/a[1])[@href=\"/".$_GET["user"]."\"]/../a[2]/text()");
if ($urls->length != $displayNames->length)
{
    //error
    $ret["error"] = true;
    exit();
}
$ret["transactions"] = array();
for ($i=0;$i<$urls->length;$i++)
{
    $user = array();
    $user["url"] = substr($urls->item($i)->textContent,1);
    $user["displayName"] = $displayNames->item($i)->textContent;
    $ret["transactions"][] = $user;
}
//var_dump($displayNames);
echo json_encode($ret);
?>