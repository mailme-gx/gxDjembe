Ext.define('App.SongwriterTpl', { extend   : 'Ext.Container',
	constructor: function(config){
		this.config = config || {};
		this.config.sid = this.config.sid || '-1';
		this.config.noOptions = this.config.noOptions || false;
		this.config.notation = this.config.notation || Ext.util.Cookies.get("notation") || 'dot';
		this.config.startHand = this.config.startHand || Ext.util.Cookies.get("startHand") || 'R';

		this.song = this.config.song || new Song();
		this.addEvents(['songchange']);
		if(!this.config.noOptions) {
			this.options = oMain.createOptionsBtn([
				{ text: _(this.config.notation == 'dot' ? 'BTN_LETTER_NOTATION' : 'BTN_DOT_NOTATION'), val: this.config.notation, scope: this, handler: this.switchNotation },
				{ text: _(this.config.startHand == 'R' ? 'BTN_HAND_START_LEFT' : 'BTN_HAND_START_RIGHT'), val: this.config.startHand, scope: this, handler: this.switchStartHand },
				{ text: _('LBL_EDITMODE_TITLE'), scope: this, handler: this.switchEditMode },
				{ text: _('BTN_SONG_DELETE'), scope: this, handler: this.deleteSong, hidden: true },
//				{ text: _('BTN_SONG_SAVE'), scope: this, handler: this.saveSong, hidden: true },
				{ text: _('BTN_SONG_PRINT'), scope: this, handler: this.printSong }
			]);
		}

		this.header = Ext.create('Ext.Container', {
			padding: "5px;",
	        layout: 'hbox',
			items: [
				new Ext.Container({ width:80, height: 80, html: '<center><img src="/img/djembe3.png" onclick="Ext.getCmp(\'' + this.getId() + '\').openPlayer();" />' 
					 + '<br /><input type="checkbox" id="mute-' + this.getId() + '" checked="' + this.getChecked() + '" onclick="Ext.getCmp(\'' + this.getId() + '\').toggleMute(this.checked);" /></center>'
				}),
				new Ext.Container({ style: 'padding: 10px;', items: this.options})
			]
		});
		this.lblName = new Ext.Container({ hidden: this.isEditmode(), html: '<div style="font-size: 16px; font-weight: bold; padding: 15px;">' + this.song.get('name') + '</div>' });
		this.header.add(this.lblName);
		this.fp = Ext.create('Ext.form.Panel', {
			flex: 1, 
			hidden: !this.isEditmode(), 
			layout: 'hbox',
			fieldDefaults: {
				labelAlign: 'top',
				msgTarget: 'side',
				width: 50
			}, defaults: {
				xtype: 'numberfield',
				minValue: 1,
				maxValue: 100
			}, items: [{
				xtype:'textfield',
				fieldLabel: _('LBL_SONG_NAME'),
				name: 'first',
				flex: 1,
				value: this.song.get('name'),
				listeners: {
					change: {scope:this, fn: function(field, newValue, oldValue){
						this.song.set('name', newValue);
						this.fireEvent('songchange', this, this.song.getRhythm());	
					}}
				}
			},{
				fieldLabel: _('LBL_SONG_LENGTH'),
				name: 'rows',
				value: this.song.getLength(),
				listeners: {
					change: {scope:this, fn: function(field, newValue, oldValue){
						this.song.setLength(newValue);
						this.song.initRun = false;
						this.fireEvent('songchange', this, this.song.getRhythm());	
					}}
				}
			}
		]});
		this.header.add(this.fp);
		this.header.add(new Ext.Container({width: 20}));

        this.sheet = this.getSheet();
        this.annotation = new Ext.form.field.TextArea({flex: 1, readOnly: true, height: 200,  emptyText: _('LBL_ANNOTATION'), value: this.song.get('description'), listeners: { change: {scope:this, fn: function(field, newValue, oldValue){ this.song.set('description', newValue); }}}}); // notes may confuse sound with description hence we name it annotation
        this.items = [this.header, this.sheet, new Ext.Container({ layout: 'hbox', items: [this.annotation] })];

		App.SongwriterTpl.superclass.constructor.call(this, this.config);

		if(this.config.song == null) { // new song
			this.song.addRow();
			this.on('afterrender', function(panel, rhythm) {
				this.switchEditMode();
			}, this, {single: true});	
		} 
		this.on('songchange', function(panel, rhythm, deleted) { this.sheet.update(rhythm); if(!this.config.noOptions) { oMain.notifySongChanged.apply(oMain, [this.song, deleted]); } }, this);
		this.fireEvent('songchange', this, this.song.getRhythm());	

/*
		this.on('beforeclose', function() {
			if(this.song.dirty) {
				Ext.Msg.show({
				     title:_('MSG_SONG_CLOSE_CONFIRM_TITLE'),
				     msg: _('MSG_SONG_CLOSE_CONFIRM_MESSAGE'),
				     buttons: Ext.Msg.YESNOCANCEL,
				     fn: function(buttonId) {
						switch(buttonId) {
							case 'cancel': break; // do nothing 
							case 'yes': // save
						    	this.saveSong(function(records, operation, success) {
						    		if(success) 
						    			this.close();
						    	}, this);
							break;
							case 'no': // no save save
								this.song.reject(true);
								this.close();
							break;
						}
				     },
				     scope: this
				});
				return false;
			} else return true;
		}, this);
*/ 
	},
	
	getSheet: function() {
		return Ext.create('Ext.container.Container', {
			padding: 10,
			tpl: new Ext.XTemplate(
			    '<tpl for=".">' +
			        '<div>' +
						'<div style="padding: 5px; display: inline-block;">' +
							'{[this.getInstrument(xindex, values.type)]}' +
							'{[this.getImage(xindex, values.type)]}' +
							'{[this.getMute(xindex)]}' +
							'{[this.getCopy(xindex)]}' +
							'{[this.getPaste(xindex)]}' +
							'{[this.getDelete(xindex)]}' +
						'</div>' +
				        '<div style="padding: 5px; display: inline-block; vertical-align: top;">' +
					        '{[this.getName(values, xindex)]}' +
					        '{[this.getDescription(values, xindex)]}' +
						    '<tpl for="notes">' +
						        '{[this.getInfo(xindex, parent.rowpos, xindex - 1)]}' +
						    '</tpl>' +
					        '<br />' +
						    '<tpl for="notes">' +
						        '{[this.getNote(values, parent.rowpos, xindex - 1)]}' +
						    '</tpl>' +
					        '<br />' +
						    '<tpl for="notes">' +
						        '{[this.getInfo("hands", parent.rowpos, xindex - 1)]}' +
						    '</tpl>' +
				        '</div>' +
			        '</div>' +
			    '</tpl>' + 
				'{[this.getAddRow()]}',
			    {
			        disableFormats: true,
			        scope: this,
			        getName: function(values, i){
			        	values.rowpos = i - 1;
			        	var txt  = values.name || ''; 
						var handler = ' onchange="Ext.getCmp(\'' + this.scope.getId() + '\').changeRowName(' + values.rowpos + ', this.value);"'; 
		           		return this.scope.isEditmode() ? '<input type="text" class="instField instFieldEdit" value="' + txt + '"' + handler + ' />' :
		           		 '<div class="instField">' + txt + '</div>';
			        },
			        getDescription: function(values, i){
			        	values.rowpos = i - 1;
			        	var txt  = values.description || ''; 
						var handler = ' onchange="Ext.getCmp(\'' + this.scope.getId() + '\').changeRowDescription(' + values.rowpos + ', this.value);"'; 
		           		return this.scope.isEditmode() ? '<input type="text" class="instField instFieldEdit" value="' + txt + '"' + handler + ' />' :
		           		 '<div class="instField">' + txt + '</div>';
			        },
			        getMute: function(i){
		           		return '<br /><center><input type="checkbox" id="mute-' + this.scope.getId() + '-' + i + (this.scope.getChecked(i) ? '" checked="true' : '') + '" onclick="Ext.getCmp(\'' + this.scope.getId() + '\').updatePlayer();" /></center>';
			        },
			        getCopy: function(i){
		           		return !this.scope.isEditmode() ? '' : '<br /><center>' +
		           				'<a href="javascript:void(0);" onclick="Ext.getCmp(\'' + this.scope.getId() + '\').copyRow(' + i + ');">' +
		           				_('BTN_COPY') +
		           				'</a></center>';
			        },
			        getPaste: function(i){
		           		return !this.scope.isEditmode() ? '' : '<center>' +
		           				'<a href="javascript:void(0);" onclick="Ext.getCmp(\'' + this.scope.getId() + '\').pasteRow(' + i + ');">' +
		           				_('BTN_PASTE') +
		           				'</a></center>';
			        },
			        getDelete: function(i){
		           		return !this.scope.isEditmode() ? '' : '<center>' +
		           				'<a href="javascript:void(0);" onclick="Ext.getCmp(\'' + this.scope.getId() + '\').deleteRow(' + i + ');">' +
		           				_('BTN_ROW_DELETE') +
		           				'</a></center>';
			        },
			        getInstrument: function(i, type){
		           		return !this.scope.isEditmode() ? '' : '<center>' +
		           				'<a href="javascript:void(0);" onclick="Ext.getCmp(\'' + this.scope.getId() + '\').selectInstrument(' + i + ');">' +
		           				_('BTN_ROW_TYPE') +
		           				'</a><br />' + type + '</center>';
			        },
			        getAddRow: function(){
		           		return !this.scope.isEditmode() ? '' : 	'<div style="padding: 5px; display: inline-block;">' + this.getImage(-1, 'djembe') +
							'<center><a href="javascript:void(0);" onclick="Ext.getCmp(\'' + this.scope.getId() + '\').addRow();">' + _('BTN_ROW_ADD') + '</a></center></div>';
			        },
			        getImage: function(row, type){
						var handler = row == null ? '' : ' onclick="Ext.getCmp(\'' + this.scope.getId() + '\').openPlayer(' + (row - 1) + ');"'; 
		           		return '<img src="/img/' + type + '.png"' + handler + ' />';
			        },
			        getInfo: function(value, row, pos){
						var val = value;
			        	if(value == "hands"){
							var startHand = this.scope.config.startHand;
							var odd = pos % 2 == 0;
							val = odd ? (this.scope.config.startHand == "R" ? _('SYM_RIGHT') : _('SYM_LEFT')) : (this.scope.config.startHand == "R" ? _('SYM_LEFT') : _('SYM_RIGHT'));
						}
						var dim = this.scope.song.getNote(row, pos) == "p" ? ' noteButtonInfoDim' : ''; 
		           		return '<div class="noteButtonBase noteButtonInfo ' + dim + '">' + val + '</div>';
			        },
			        getNote: function(note,row, pos){
			        	var notation = this.scope.config.notation
			        	var retval = ''
						if(notation == 'letter') {
							var handler = ' onclick="Ext.getCmp(\'' + this.scope.getId() + '\').changeNoteNext(' + row + ', ' + pos + ');"';
							retval += '<div class="noteButtonBase' + (note != 'p' ? ' noteButtonBold' : '') + ' noteButtonLetter"' + handler + '>' + this.scope.song.getSymbol(row, pos) + '</div>';
						} else if(notation == 'dot') {
							var handler = ' onclick="Ext.getCmp(\'' + this.scope.getId() + '\').changeNote(' + row + ', ' + pos + ', \'{0}\');"'; 
							retval += '<div style="display: inline-block;">';
							retval += '<div class="noteButtonBase noteButtonSlap' + (note == 's' ? 'On': note == 'ss' ? 'Flam' : 'Off') + '"' + Ext.String.format(handler, note == 's' ? 'ss' : note != 'ss' ? 's' : 'p') + '></div>';
							retval += '<div class="noteButtonBase noteButtonTone' + (note == 't' ? 'On': note == 'tt' ? 'Flam' : 'Off') + '"' + Ext.String.format(handler, note == 't' ? 'tt' : note != 'tt' ? 't' : 'p') + '></div>';
							retval += '<div class="noteButtonBase noteButtonBass' + (note == 'b' ? 'On': note == 'bb' ? 'Flam' : 'Off') + '"' + Ext.String.format(handler, note == 'b' ? 'bb' : note != 'bb' ? 'b' : 'p') + '></div>';
							retval += '</div>';
						} else {
							retval += ' ' + notation + ' ' + note; // for debugging
						}
		           		return retval;
			        }
			    }
			)
		});
	},

	switchNotation: function(btn, evt) {
		var nt = btn.val;
		this.config.notation = btn.val == 'dot' ? 'letter' : 'dot';
		btn.val = this.config.notation;
		btn.setText(_(this.config.notation == 'dot' ? 'BTN_LETTER_NOTATION' : 'BTN_DOT_NOTATION'));
		this.fireEvent('songchange', this, this.song.getRhythm());	
		Ext.util.Cookies.set("notation", this.config.notation);
	},

	switchStartHand: function(btn, evt) {
		var nt = btn.val;
		this.config.startHand = btn.val == 'R' ? 'L' : 'R';
		btn.val = this.config.startHand;
		btn.setText(_(this.config.startHand == 'R' ? 'BTN_HAND_START_LEFT' : 'BTN_HAND_START_RIGHT'));
		this.fireEvent('songchange', this, this.song.getRhythm());	
		Ext.util.Cookies.set("startHand", this.config.startHand);
	},

	openPlayer: function(row) {
		if(this.config.noOptions) { return; }
		var player = oMain.getPlayer();
		var r = row == null ? this.song.getRhythm().slice(0) : [this.song.getRhythm()[row]];
		var l = r.length;
		if(row == null) {
			for(var i = r.length - 1; i >= 0; i--) {
				var c = Ext.get('mute-' + this.getId() + '-' + (i + 1));
				if(c != null && c.dom != null && c.dom.checked == false)
					r.splice(i, 1);
			}
		}
			
		r.description = this.song.get('name') + (row == null ? ' ' + r.length + '/' + l : ' - ' + this.song.getRowName(row));
		player.modeSingle = row != null;
		player.update(r);
		player.show();
	},

	updatePlayer: function() {
		if(this.config.noOptions) { return; }
		var player = oMain.getPlayer();
		if(player.modeSingle) return;
		var r = this.song.getRhythm().slice(0);
		var l = r.length;
		for(var i = r.length - 1; i >= 0; i--) {
			var c = Ext.get('mute-' + this.getId() + '-' + (i + 1));
			if(c != null && c.dom != null && c.dom.checked == false)
				r.splice(i, 1);
		}
		
		r.description = this.song.get('name') + ' ' + r.length + '/' + l;
		player.update(r);
	},

	toggleMute: function(mute) {
		var r = this.song.getRhythm();
		for(var i = 0; i < r.length; i++) {
			var c = Ext.get('mute-' + this.getId() + '-' + (i + 1));
			if(c != null && c.dom != null) 
				c.dom.checked = mute;
		}
		this.updatePlayer();
	},

	getChecked: function(id) {
		var c = Ext.get(cId = 'mute-' + this.getId() + (id == null ? ''  : '-' + id));
		if(c != null && c.dom != null) 
			return c.dom.checked;
		return true;
	},

	copyRow: function(row) {
		if(!this.isEditmode()) 
			return;  
		var r = this.song.getRhythm();
		if(r.length >= row)
			oMain.setClipboard(r[row-1]);
	},

	pasteRow: function(row) {
		var p = oMain.getClipboard();
		if(!this.isEditmode() || p == null || p.notes == null) 
			return;  
		var s = this.song.getRhythm();
		if(s.length >= row) {
			var r = s[row-1];
			for(var i = 0; i < r.notes.length; i++) 
				this.song.setNote(row-1, i, p.notes.length <= i ? 'p' : p.notes[i]);

			this.fireEvent('songchange', this, this.song.getRhythm());	
			this.updatePlayer();
		}
	},

	deleteRow: function(row) {
		this.song.deleteRow(row);
		this.fireEvent('songchange', this, this.song.getRhythm());	
		this.updatePlayer();
	},
	
	selectInstrument: function(row) {
		var types = [];
		for(var o in this.song.instrumentTypes) {
			types.push(new Ext.Container({
					style: 'padding: 10px;', 
					html: '<a href="javascript:void(0);" onclick="Ext.getCmp(\'' + this.getId() + '\').setInstrument(' + row + ', \'' + o + '\');">' +
 				        	'<img src="/img/' + o + '.png" /><br />' + this.song.instrumentTypes[o].name + '</a>' 
				}));
		}
		this.typeWin = Ext.create('Ext.window.Window', {
			width: 350,
			height: 150,
			modal: true,
			resizable: false,
			layout: 'fit', 
			items: new Ext.Container({ style: 'background-color: white;', layout: 'hbox', items: types })
		});
		this.typeWin.show();
	},
	
	setInstrument: function(row, type) {
		this.typeWin.close();
		this.song.setRowType(row-1, type);
		this.fireEvent('songchange', this, this.song.getRhythm());	
		this.updatePlayer();
	},
	
	addRow: function() {
		this.song.addRow();
		this.fireEvent('songchange', this, this.song.getRhythm());	
		this.updatePlayer();
	},

	changeNote: function(row, pos, note) {
		if(!this.isEditmode()) 
			return;  
		this.song.setNote(row, pos, note);
		this.fireEvent('songchange', this, this.song.getRhythm());	
		this.updatePlayer();
	},

	changeNoteNext: function(row, pos) {
		if(!this.isEditmode()) 
			return;  
		this.song.setNextNote(row, pos);
		this.fireEvent('songchange', this, this.song.getRhythm());	
		this.updatePlayer();
	},

	changeRowName: function(row, value) {
		this.song.setRowName(row, value);
		this.fireEvent('songchange', this, this.song.getRhythm());	
	},

	changeRowDescription: function(row, value) {
		this.song.setRowDescription(row, value);
		this.fireEvent('songchange', this, this.song.getRhythm());	
	},

	printSong: function() {
		var t = new Ext.XTemplate(
			'<div style="padding: 10px;"><div style="height: 80px""><img style="vertical-align: middle;" src="/img/djembe3.png" /><span style="font-size: xx-large;">&nbsp;&nbsp;' + this.song.get('name') + '</span></div>' +
		    '<tpl for=".">' +
		        '<div>' +
					'<div style="padding: 5px; display: inline-block;"><img src="/img/{type}.png" /></div>' +
			        '<div style="padding: 5px; display: inline-block; vertical-align: top;">' +
				        '<div style="padding: 2px;">{name}</div>' +
				        '<div style="padding: 2px;">{description}</div>' +
					    '<tpl for="notes">' +
					        '{[this.getInfo(xindex, parent.rowpos, xindex - 1)]}' +
					    '</tpl>' +
				        '<br />' +
					    '<tpl for="notes">' +
					        '{[this.getNote(values, parent.rowpos, xindex - 1)]}' +
					    '</tpl>' +
				        '<br />' +
					    '<tpl for="notes">' +
					        '{[this.getInfo("hands", parent.rowpos, xindex - 1)]}' +
					    '</tpl>' +
			        '</div>' +
		        '</div>' +
		    '</tpl>' +
				'<div style="padding: 2px;">' + this.song.get('description').replace(/\n/g, '<br />\n') + '</div>' +
	        '</div>',
		    {
		        disableFormats: true,
		        scope: this,
		        getInfo: function(value, row, pos){
					var val = value;
					if(value == "hands"){
						var startHand = this.scope.config.startHand;
						var odd = pos % 2 == 0;
						val = odd ? (this.scope.config.startHand == "R" ? _('SYM_RIGHT') : _('SYM_LEFT')) : (this.scope.config.startHand == "R" ? _('SYM_LEFT') : _('SYM_RIGHT'));
					}
					var dim = this.scope.song.getNote(row, pos) == "p" ? ' color: lightgrey;' : ''; 
	           		return '<div style="width: 24px; height: 20px; text-align: center; display: inline-block; ' + dim + '">' + val + '</div>';
		        },
		        getNote: function(note,row, pos){
		        	var notation = this.scope.config.notation
		        	var retval = ''
					if(notation == 'letter') {
						retval += '<div style="width: 22px; height: 18px; text-align: center; border: 1px solid lightgrey; display: inline-block;' + (note != 'p' ? ' font-weight: bold;' : '') + '">' + this.scope.song.getSymbol(row, pos) + '</div>';
					} else if(notation == 'dot') {
						retval += '<div style="display: inline-block;">';
						retval += '<div style="width: 24px; height: 20px;"><img src="/img/noteSlap' + (note == 's' ? 'On': note == 'ss' ? 'Flam' : 'Off') + '.png" /></div>';
						retval += '<div style="width: 24px; height: 20px;">' +
								'<img src="/img/noteTone' + (note == 't' ? 'On': note == 'tt' ? 'Flam' : 'Off') + '.png" />' +
								'<img src="/img/noteSpacer.png" />' +
								'<img src="/img/noteSpacer.png" />' +
								'<img src="/img/noteSpacer.png" />' +
								'<img src="/img/noteSpacer.png" />' +
								'</div>';
						retval += '<div style="width: 24px; height: 20px;"><img src="/img/noteBass' + (note == 'b' ? 'On': note == 'bb' ? 'Flam' : 'Off') + '.png" /></div>';
						retval += '</div>';
					}
	           		return retval;
		        }
		});
		
		var frame = new Ext.form.field.HtmlEditor({
			hideLabel: true,
			ctCls: 'print',
			value: t.apply(this.song.getRhythm())
		});
		var win = Ext.create('Ext.window.Window', {
			title: _('LBL_PRINT_TITLE'),
			width: 900,
			height: 600,
			modal: false,
			resizable: true,
			layout: 'fit', 
			items: frame,
			buttons: [{ text: _('BTN_SONG_PRINT') , scope: this, handler: function() { 
				var f = frame.iframeEl.dom;
				if(f != null) {
					window.frames[f.name].focus();
					window.frames[f.name].print();														
				}
			} },
		 	{ text: _('BTN_CLOSE'), scope: this, handler: function() { win.close(); } }
		]});
		win.show();

	},
/*
	saveSong: function(fOnComplete, scope) {
		if(!this.song.dirty)
			return oMain.showMessage(_('MSG_SONG_SAVE_NOCHANGE'), _('BTN_SONG_SAVE'));

		scope = scope || this;

		this.lm = this.lm || new Ext.LoadMask(this);
		this.lm.show();
		var ch = this.song.getChanges();
		var bReload = (this.song.get('id') < 1 || (ch != null && ch.name != null) )
		this.song.save({
			params: {a: 'savesong'},
			scope: this,
			success: function(records, operation) {
				if(this.lm != null)
					this.lm.hide();
				if(bReload)
		        	oMain.reloadList();
				if(fOnComplete != null && Ext.isFunction(fOnComplete))
					fOnComplete.call(scope, records, operation, true);
				oMain.showMessage(_('MSG_SONG_SAVE_SUCCESS'), _('BTN_SONG_SAVE'));
				if(oMain.tabs.get(this.song.get('id')) == null)
					oMain.tabs.add(this.song.get('id'), this);
			},
			failure: function(records, operation) {
				if(this.lm != null)
					this.lm.hide();
				if(fOnComplete != null && Ext.isFunction(fOnComplete))
					fOnComplete.call(scope, records, operation, true);
				oMain.showMessage( _('MSG_SONG_SAVE_FAILED'), _('BTN_SONG_SAVE'), true);
			}
		});
	},
*/	
	deleteSong: function() {
		Ext.Msg.confirm(_('MSG_SONG_DELETE_CONFIRM_TITLE'), _('MSG_SONG_DELETE_CONFIRM_MESSAGE'),function(id) {
		     	if(id == 'yes') {
					oMain.songStore.remove(this.song);
					this.fireEvent('songchange', this, this.song.getRhythm(), true);	
					oMain.showMainView();
/*
					this.lm = this.lm || new Ext.LoadMask(this);
					this.lm.show();
					this.song.destroy({
						params: {a: 'deletesong'},
						scope: this,
						success: function() {
							if(this.lm != null)
								this.lm.hide();
							this.close();
					        oMain.reloadList();
							oMain.showMessage(_('MSG_SONG_DELETE_SUCCESS'), _('BTN_SONG_DELETE'));
						},
						failure: function() {
							if(this.lm != null)
								this.lm.hide();
							oMain.showMessage(_('MSG_SONG_DELETE_FAILED'), _('BTN_SONG_DELETE'), true);
						},
						callback: function() {
						}
					});
*/
		     	}
		     }, this
		);
	},
	
	isEditmode: function() {
		return this.editMode;
	},

	doSwitchEditMode: function() {
		this.editMode = !this.editMode;
		this.lblName.setVisible(!this.editMode);
		this.fp.setVisible(this.editMode);
		this.sheet.update(this.song.getRhythm()); 	
//		this.options.menu.items.getAt(3).setVisible(this.editMode);
		this.options.menu.items.getAt(4).setVisible(this.editMode);
		this.annotation.setReadOnly(!this.editMode);
	},

	switchEditMode: function(fProceede, scope) {
		this.doSwitchEditMode();
/*
		var win = Ext.create('Ext.window.Window', {
			title: _('LBL_EDITMODE_TITLE'),
			modal: true,
			items: [ new Ext.Container({ padding: 5, html: _('LBL_EDITMODE_MSG', this.isEditmode() ? _('LBL_EDITMODE_DISABLE') : _('LBL_EDITMODE_ENABLE') ) })],
			buttons: [
			  { text: _('BTN_OK') , scope: this, handler: function() { this.doSwitchEditMode(win, fProceede, scope); win.close(); } },
			  { text: _('BTN_CANCEL'), scope: this, handler: function() { win.close(); } }
			]
		});
		win.show();
*/
	}

});

Ext.define('Song', { extend: 'Ext.data.Model',
	idgen: 'uuid',
    fields: [
        {name: 'id', type: 'string'}, // TODO : default must be uuid Ext.data.UuidGenerator.create().generate()
        {name: 'name', type: 'string', defaultValue: 'New song'},
        {name: 'description', type: 'string', defaultValue: ''},
        {name: 'beats', type: 'int', defaultValue: '8'},
        {name: 'rhythm', type: 'string', defaultValue: '[]'}
    ],
	instrumentTypes: {
    	djembe: { 
	    	name: App.lang.get('LBL_DJEMBE_INSTRUMENT'),
	    	noteTypes: {
	    		p: { key: 'p', symbol: App.lang.get('SYM_PULSE'), previous: 'ss', next: 'b' },
	    		b: { key: 'b', symbol: App.lang.get('SYM_BASS'),  previous: 'p', next: 't' },
	    		t: { key: 't', symbol: App.lang.get('SYM_TONE'),  previous: 'b', next: 's' },
	    		s: { key: 's', symbol: App.lang.get('SYM_SLAP'),  previous: 't', next: 'bb' },

	    		bb: { key: 'bb', symbol: App.lang.get('SYM_BASS_FLAM'),  previous: 's', next: 'tt' },
	    		tt: { key: 'tt', symbol: App.lang.get('SYM_TONE_FLAM'),  previous: 'bb', next: 'ss' },
	    		ss: { key: 'ss', symbol: App.lang.get('SYM_SLAP_FLAM'),  previous: 'tt', next: 'p' }
	    	}
    	},
    	kenneni: { 
			name: App.lang.get('LBL_KENNENI_INSTRUMENT'),
			noteTypes: {
				p: { key: 'p', symbol: App.lang.get('SYM_PULSE'), previous: App.lang.get('SYM_PULSE'), next: App.lang.get('SYM_PULSE') },
	    		b: { key: 'b', symbol: App.lang.get('SYM_BASS'),  previous: 'p', next: 't' },
	    		t: { key: 't', symbol: App.lang.get('SYM_TONE'),  previous: 'b', next: 'p' }
			}
		},
		sangban: { 
			name: App.lang.get('LBL_SANGBAN_INSTRUMENT'),
			noteTypes: {
				p: { key: 'p', symbol: App.lang.get('SYM_PULSE'), previous: App.lang.get('SYM_PULSE'), next: App.lang.get('SYM_PULSE') },
	    		b: { key: 'b', symbol: App.lang.get('SYM_BASS'),  previous: 'p', next: 't' },
	    		t: { key: 't', symbol: App.lang.get('SYM_TONE'),  previous: 'b', next: 'p' }
			}
		},
		doundoun: { 
			name: App.lang.get('LBL_DOUNDOUN_INSTRUMENT'),
			noteTypes: {
				p: { key: 'p', symbol: App.lang.get('SYM_PULSE'), previous: App.lang.get('SYM_PULSE'), next: App.lang.get('SYM_PULSE') },
	    		b: { key: 'b', symbol: App.lang.get('SYM_BASS'),  previous: 'p', next: 't' },
	    		t: { key: 't', symbol: App.lang.get('SYM_TONE'),  previous: 'b', next: 'p' }
			}
		},
		bell: { 
			name: App.lang.get('LBL_BELL_INSTRUMENT'),
			noteTypes: {
				p: { key: 'p', symbol: App.lang.get('SYM_PULSE'), previous: 's', next: 't' },
	    		t: { key: 't', symbol: App.lang.get('SYM_LOW'),  previous: 'p', next: 's' },
	    		s: { key: 's', symbol: App.lang.get('SYM_HIGH'),  previous: 't', next: 'tt' },
	    		tt: { key: 'tt', symbol: App.lang.get('SYM_LOW_MUFFLED'),  previous: 's', next: 'ss' },
	    		ss: { key: 'ss', symbol: App.lang.get('SYM_HIGH_MUFFLED'),  previous: 'tt', next: 'p' }
			}
		}
	},
	_initJSong: function() {
		/*
		 * this.jSong is json formatted song definition with folowing format:
		 * [ // array of rhythms (instruments) in song
		 *  { 
		 * 	 name: 'Djembe 1', // name of rhythm or instrument
		 *   type: 'djembe', // type of instrument as defined in this class
		 *   notes: [] // notes played in this rhythm
		 *   hands: [] // hand used for each note
		 *  }
		 * ]
		 */ 
		if(this.jSong == null || this.initRun != true) {
			this.jSong = this.jSong || Ext.decode(this.get('rhythm') || []);

			var pulses = this.getLength();
			for (var i = 0; i < this.jSong.length; i++) {
				if(this.jSong[i] == null) 
					this.jSong[i] = {
						name: this.instrumentTypes.djembe.name + ' ' + (i + 1),
						description: '',
						type: 'djembe',
						notes: []
					};
				this.jSong[i].notes = this.jSong[i].notes || [];
				if(this.jSong[i].notes.length > pulses)
					while(this.jSong[i].notes.length > pulses) 
						this.jSong[i].notes.pop();
				for (var j = 0; j < pulses; j++){
					this.jSong[i].notes[j] = this.jSong[i].notes[j] || this.instrumentTypes.djembe.noteTypes.p.key;
				}
			}
			
			this.initRun = true;
		}
    },
/*
	setHand: function(row, pos, hand) {
		this._initJSong();
		var startRight = this.jSong[row].hands[0] == 'L';
		var odd = ( startRight ? 'R' : 'L');
		var even = ( startRight ? 'L' : 'R');
		for (var j = 0; j < this.jSong[row].hands.length; j++)
			this.jSong[row].hands[j] = (j % 2 != 0) ? even : odd;

		this.set('rhythm', Ext.encode(this.jSong));
    },
	getHand: function(row, pos) {
		this._initJSong();
		return this.jSong[row].hands[pos]; 
    },
 */ 
	setNote: function(row, pos, note) {
		this._initJSong();
		this.jSong[row].notes[pos] = note; 
		this.set('rhythm', Ext.encode(this.jSong));
    },
	setNextNote: function(row, pos, backward) {
		this._initJSong();
		this.jSong[row].notes[pos] = this.instrumentTypes[this.jSong[row].type].noteTypes[this.jSong[row].notes[pos]][backward ? 'previous' : 'next'];
		this.set('rhythm', Ext.encode(this.jSong));
		return this.instrumentTypes[this.jSong[row].type].noteTypes[this.jSong[row].notes[pos]].symbol;
    },
	getNote: function(row, pos) {
		this._initJSong();
		return this.jSong[row].notes[pos]; 
    },
	getSymbol: function(row, pos) {
		this._initJSong();
		return this.instrumentTypes[this.jSong[row].type].noteTypes[this.jSong[row].notes[pos]].symbol;
    },
	setRowDescription: function(row, dscr) {
		this._initJSong();
		this.jSong[row].description = dscr; 
		this.set('rhythm', Ext.encode(this.jSong));
    },
	getRowDescription: function(row) {
		this._initJSong();
		return this.jSong[row].description; 
    },
	setRowName: function(row, name) {
		this._initJSong();
		this.jSong[row].name = name; 
		this.set('rhythm', Ext.encode(this.jSong));
    },
	getRowName: function(row) {
		this._initJSong();
		return this.jSong[row].name; 
    },
	setRowType: function(row, type) {
		this._initJSong();
		this.jSong[row].name = this.jSong[row].name.replace(this.instrumentTypes[this.jSong[row].type].name, this.instrumentTypes[type].name);
		this.jSong[row].type = type; 
		this.set('rhythm', Ext.encode(this.jSong));
    },
	getRowType: function(row) {
		this._initJSong();
		return this.jSong[row].type; 
    },
	deleteRow: function(row) {
		this._initJSong();
		this.jSong.splice(row - 1, 1); 
		this.set('rhythm', Ext.encode(this.jSong));
    },
	addRow: function() {
		this._initJSong();
		var newRow = {
			name: this.instrumentTypes.djembe.name + ' ' + (this.jSong.length + 1),
			description: '',
			type: 'djembe',
			notes: []
		};
		var pulses = this.getLength();
		for (var j = 0; j < pulses; j++){
			newRow .notes[j] = newRow .notes[j] || this.instrumentTypes.djembe.noteTypes.p.key;
		}
		this.jSong.push(newRow);

		this.set('rhythm', Ext.encode(this.jSong));
    },
	getLength: function() {
		return this.get("beats");
    },
	setLength: function(len) {
		this.set("beats", len);
		this._initJSong();
		this.set('rhythm', Ext.encode(this.jSong));
    },
	getRhythm: function() {
		this._initJSong();
		return this.jSong; 
    }    
});
