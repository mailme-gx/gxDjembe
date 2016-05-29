<?php 

$a=getUrlFormVar("a", "getIndexPage");
echo $a();

function getIndexPage() {
	echo "<html><head><title>GX Djembe</title>\n" . 
		"<link href=\"//cdn.sencha.com/ext/gpl/4.2.0/resources/css/ext-all.css\" rel=\"stylesheet\" />" .
		"<script type=\"text/javascript\" charset=\"utf-8\" src=\"//cdn.sencha.com/ext/gpl/4.2.0/ext-all-debug.js\"></script>" .
		getCss("js/main.css") . 
		getScript("js/lang.js") .  getScript("js/main.js") .  getScript("js/song.js") .  getScript("js/sound.js") . getScript("js/parser.js") . 
//		getCss("js/ext-all.css") . getCss("js/main.css") . 
//		getScript("js/ext-all-debug.js") .  getScript("js/lang.js") .  getScript("js/main.js") .  getScript("js/song.js") .  getScript("js/sound.js") . getScript("js/parser.js") . 
		'<script type="text/javascript">' . 
		"\n _ = App.lang.get;" . 
		"\n Ext.onReady(function() {" . 
		"\n oMain = new App.Main();" . 
		"\n });" . 
		"\n</script>" . 
		"\n</head><body>wtf... no javascript??</body></html>";
}

function getCss($script) {
	return '<link rel="stylesheet" type="text/css" href="' . $script . '" />' . "\n"; 
}
function getScript($script) {
	return '<script type="text/javascript" src="' . $script . '"></script>' . "\n";
}

function getSongList() {
	$current = getUrlFormVar("current");
	$dir = getDataDir(); 
	$files = array();
	if(is_dir($dir)){
		if ($handle = opendir($dir)) {
			while (false !== ($file = readdir($handle))) {
				if ($file != "." && $file != ".." && pathinfo($file, PATHINFO_EXTENSION) == "dat") {
					$files[filemtime($file)] = $file;
				}
			}
			closedir($handle);
		}
	}
	ksort($files);
	
	$fn = getDataDir() . end($files);
	$key = basename($fn);
	if($current == "" || $current != $key) {
		return '{ "name": "' . $key . '",  "data": ' . file_get_contents($fn) . "}";
	}
	
	return '{ "name": "' . $key . '"}';
}

function putSongList() {
	date_default_timezone_set("UTC");
	$data = getUrlFormVar("rows");
	$msg = getUrlFormVar("comment");
	$fn = date("YmdHise", time()) . ".unapproved"; 
	file_put_contents(getDataDir() . $fn, $data);
	$mailSent = mail ( "GX <gx@drum4joy.org>" , "Djembe songlist change submitted" , "A change has been submitted for approval.\n\n Message: " . $msg . ".\nFilename: " . $fn . "\n", "From: Notice <noreply@drum4joy.org>\r\n" ) ? 'true' : 'false';
	return '{ "name": "' . $fn . '",  "mailsent": ' . $mailSent . '}';	
}


function getUrlFormVar($name, $default = "") {
	if (isset($_GET[$name])) {
		return $_GET[$name];
	} else if (isset($_POST[$name])) {
		return $_POST[$name];
	}
	return $default;
}

function getDataDir() {
	return realpath("./data/") . '/';
}

?>
