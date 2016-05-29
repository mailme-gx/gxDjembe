

$(document).ready(function () {
	$("body").append($("<select id='fileLhs'></select>"));
	$("body").append($("<select id='fileRhs'></select>"));
	$("body").append($("<div id=\"compare\">"));
	$('#compare').mergely({ cmsettings: { lineNumbers: true } });
	$('#fileLhs').change(function(){ loadFile($(this).val(), 'lhs'); });
	$('#fileRhs').change(function(){ loadFile($(this).val(), 'rhs'); });
    $.getJSON('/admin/?a=getFiles',{},function(data) {
		$.each(Object.keys(data.files), function(key,value) {
			$.each(data.files[value], function(k,v) {
				if(v.rhythm != null) {
					v.rhythm = jQuery.parseJSON(v.rhythm);
				}
			});
		});
		document.files = data.files;
		$('#fileLhs').append($('<option></option>').val("").html("select file"));
		$('#fileRhs').append($('<option></option>').val("").html("select file"));
        $.each(Object.keys(data.files), function(i,obj) {
            $('#fileLhs').append($('<option></option>').val(obj).html(formatDisplayFilename(obj)));
            $('#fileRhs').append($('<option></option>').val(obj).html(formatDisplayFilename(obj)));
        });
    });
});

function loadFile(name, side) {
	var str = '';
	if(document.files != null && document.files[name] != null) {
		str = toPrettyJsonString(document.files[name]);
	}
	$('#compare').mergely('cm', side).setValue(str);
}

function formatDisplayFilename(name) {
	if(name != null && name.length > 12) {
		name = name.substr(0, 4) + '.' + name.substr(4, 2) + '.' + name.substr(6, 2) + ' ' + name.substr(8, 2) + ':' + name.substr(10, 2);
	}
	return name;
}

function toPrettyJsonHtml(obj) {
	return this.toPrettyJsonString(obj).replace('\n', '<br />', 'g').replace('    ', '&nbsp;&nbsp;&nbsp;&nbsp;', 'g');
}
	
function toPrettyJsonString(obj) {
	return JSON.stringify(obj, null, "    ");
}
	
