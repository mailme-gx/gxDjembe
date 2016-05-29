Ext.namespace('App');

App.Parser=Ext.extend(Ext.Container, {
	constructor: function(config){
		this.config = config || {};
		this.layout = 'fit';
	
		var options = oMain.createOptionsBtn([
			{ text: _('BTN_PARSE_INSERT_EXAMPLE'), scope: this, handler: function(){this.txt.setValue( _('MSG_PARSE_EXAMPLE')); }},
			{ text: _('BTN_PARSE'), scope: this, handler: this.parse }
		]);

		this.txt = new Ext.form.field.TextArea();
		this.items = [
			Ext.create('Ext.Container', { items: [
				Ext.create('Ext.Container', { layout: 'hbox', items: [,
					Ext.create('Ext.Container', { style: 'padding: 10px;', items: options}),
					Ext.create('Ext.Container', { padding: 10, html: _('MSG_PARSE_INSTRUCTION')})
				]}),
				Ext.create('Ext.Container', { height: 300, layout: 'fit', items: this.txt}) 
			]})
		];

		App.Parser.superclass.constructor.call(this, this.config);
	},
	
	cleanTrim: function(lines) {
		var ret = [];
		for(var i = 0; i < lines.length; i++){ 
			if(lines[i] != null && lines[i].replace(/\s/, '').length > 0)
				ret.push(lines[i].trim());
		}
		return ret;
	},
	
	isNotesLine: function(line) {
		return line != null && !(/[^btsp\s]/gi).test(line.replace(/[.-]/gi, 'p'));
	},
	
	isHandsLine: function(line) {
		return line != null && !(/[^rlfp\s]/gi).test(line.replace(/[.-]/gi, 'p'));
	},
	
	parseLines: function(lines, song) {

		if(lines.length < 2) {
			oMain.showMessage(_('MSG_PARSER_INVALID_LINE_NUMBERS'), _('MSG_PARSER_INVALID_TITLE'));
			return false;
		}

		var r = { name: lines.shift(), type: 'djembe' };

		if(!this.isNotesLine(lines[0])) {
			oMain.showMessage(_('MSG_PARSER_INVALID_NOTES_EXPECTED') + '\n' + lines[0], _('MSG_PARSER_INVALID_TITLE'));
			return false;
		}

		r.notes = lines.shift().replace(/\s/g, '').replace(/[.-]/g, 'p').toLowerCase().split('');

		if(this.isHandsLine(lines[0])) {
			r.hands = lines.shift().replace(/\s/g, '').replace(/[.-]/g, 'p').toUpperCase().split('');
			for(var i = 0; i < r.hands.length; i++){
				if(r.hands[i] == 'F') 
					r.notes[i] = r.notes[i] + r.notes[i]; 
				if(/[^RL]/.test(r.hands[i]))
					r.hands[i] = i%2 == 0 ? 'R' : 'L';
			}
		} else
			r.hands = Ext.String.repeat('RL', Math.floor(r.notes.length/2)).split('');
		song.rhythm.push(r);
		if(lines.length > 0)
			return this.parseLines(lines, song);
		return true;
		
	},
	
	parse: function() {
		var lines = this.cleanTrim(this.txt.getValue().split('\n'));

		if(lines.length == 0) 
			return oMain.showMessage(_('MSG_PARSER_INVALID_EMPTY'), _('MSG_PARSER_INVALID_TITLE'));
		
		var song = { name: lines.shift(), rhythm: [] };
		
		if(this.parseLines(lines, song)) {
			// check all bars have same beats
			song.rows = song.rhythm.length;
			song.beats = song.rhythm[0].notes.length; // user should ajust this after parse
			song.bars = 1; // user should ajust this after parse
			for(var i = 0; i < song.rhythm.length; i++)
				if(song.rhythm[i].notes.length != song.beats)
					return oMain.showMessage(_('MSG_PARSER_INVALID_BEATS_LENGTH'), _('MSG_PARSER_INVALID_TITLE'));
			song.rhythm = Ext.encode(song.rhythm);
							
			oMain.showView(function() {
				var s = Ext.create('Song', song);
				s.setDirty();
				return new App.SongwriterTpl({song: s});		
			});		
		}

	}
});

   
   
