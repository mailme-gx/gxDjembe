<?php
if(!isAuth()) {
    doAuth();
}

$a=getUrlFormVar("a", "getIndexPage");
echo $a();

function isAuth() {
	//gx4djembe = 5867c185eadda6422f00119abb499ec9b1bd626947c7a7a65f47e077874e6890
	return isset($_SERVER['PHP_AUTH_USER']) && strtolower($_SERVER['PHP_AUTH_USER']) == "admin" && hash("sha256", $_SERVER['PHP_AUTH_PW']) == "5867c185eadda6422f00119abb499ec9b1bd626947c7a7a65f47e077874e6890";
}

function doAuth() {
    header('WWW-Authenticate: Basic realm="GX Djembe admin"');
    header('HTTP/1.0 401 Unauthorized');
    exit;
}

function getIndexPage() {
	$v = getUrlFormVar("v", "lr");
	echo "<html><head><title>GX Djembe Admin</title>\n";
	if($v != 'merge' ) {
		echo "<link href=\"//cdn.sencha.com/ext/gpl/4.2.0/resources/css/ext-all.css\" rel=\"stylesheet\" />" .
			"<script type=\"text/javascript\" charset=\"utf-8\" src=\"//cdn.sencha.com/ext/gpl/4.2.0/ext-all-debug.js\"></script>" .
			getScript("/js/lang.js") .  getScript("/js/main.js") .  getScript("/js/song.js") .  getScript("/js/sound.js") . getScript("/js/parser.js") . 
			getCss("/js/main.css");
	} else {
		echo '<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.9.0/jquery.min.js"></script>' .
			getScript("/admin/merge/codemirror.min.js") . 
			getCss("/admin/merge/codemirror.css") . 
			getScript("/admin/merge/mergely.min.js") . 
			getCss("/admin/merge/mergely.css");
	}
	echo getScript("admin." . $v . ".js");
	if($v != 'merge' ) {
		echo '<script type="text/javascript">' . 
		"\n _ = App.lang.get;" . 
		"\n Ext.onReady(function() {" . 
		"\n oAdmin = new App.Admin();" . 
		"\n });" . 
		"\n</script>";
	}
	echo "\n</head><body></body></html>";
}

function getCss($script) {
	return '<link rel="stylesheet" type="text/css" href="' . $script . '" />' . "\n"; 
}
function getScript($script) {
	return '<script type="text/javascript" src="' . $script . '"></script>' . "\n";
}
function getFilesName() {
	return getFiles(false);
}

function getFilesData() {
	return getFiles(true);
}

function getFiles($bIncludeData = true) {
	$dir = getDataDir(); 
	$files = array();

	if(is_dir($dir)) {
		if($handle = opendir($dir)) {
			while (false !== ($file = readdir($handle))) {
				if(pathinfo($file, PATHINFO_EXTENSION) == "unapproved"){
					if($bIncludeData) {
						$fh = fopen($dir . $file, "r");
						$files[$file] = json_decode(stream_get_contents($fh));
						fclose($fh);
					} else {
						$files[] = array("name" => $file);
						$files[] = $file;
					}
				}
			}
			closedir($handle);
		}
	}
	
	return '{ "files": ' . json_encode($files) . '}';
}
/*
function putSongList() {
	date_default_timezone_set("UTC");
	$data = getUrlFormVar("rows");
	$msg = getUrlFormVar("comment");
	$fn = date("YmdHise", time()) . ".unapproved"; 
	file_put_contents(getDataDir() . $fn, $data);
	$mailSent = mail ( "GX <gx@drum4joy.org>" , "Djembe songlist change submitted" , "A change has been submitted for approval.\n\n Message: " . $msg . ".\nFilename: " . $fn . "\n", "From: Notice <noreply@drum4joy.org>\r\n" ) ? 'true' : 'false';
	return '{ "name": "' . $fn . '",  "mailsent": ' . $mailSent . '}';	
}
*/

function acceptFile() {
	$dir = getDataDir(); 
	$fn = $dir . getUrlFormVar('name', '');

	if(is_dir($dir)){
		if($handle = opendir($dir)) {
			while (false !== ($file = readdir($handle))) {
				if(pathinfo($file, PATHINFO_EXTENSION) == 'dat'){
					renameFile($dir . $file, '.dat', '.old');
				}
			}
			closedir($handle);
		}
	}
	return '{ "success": ' . (renameFile($fn, '.unapproved', '.dat') ? 'true' : 'false') . '}';
}

function rejectFile() {
	$fn = getDataDir() . getUrlFormVar('name', '');
	return '{ "success": ' . (renameFile($fn, '.unapproved', '.rejected') ? 'true' : 'false') . '}';
}

function renameFile($file, $find, $replace) {
	return rename($file, str_replace($find, $replace, $file));
}

function getUrlFormVar($name, $default = "") {
	if(isset($_GET[$name])) {
		return $_GET[$name];
	} else if(isset($_POST[$name])) {
		return $_POST[$name];
	}
	return $default;
}

function getDataDir() {
	return realpath('../data/') . '/';
}

?>
