
Ext.define('App.Main', { extend: 'Ext.container.Viewport',
	constructor: function(config){
		this.config = config || {};
		this.layout = 'fit';

		this.centralServerUrl = '/?a=';

		this.todo = [
'need to add save buttton and push changes to server',
'song add move up/down on each row to change ordering (at the moment can be done by copy paste)',
'add subscribe and unsubscribe by email', // a user can subscribe and be notified when changed are accepted
''];

		this.useLocalStore = false;
/*
		try {
			this.songListStore = Ext.create('Ext.data.JsonStore', {
				autoSync: true,
				fields: ["name","data"],
				proxy: { type: 'localstorage', id  : 'song-lists' }
			});
		} catch(e) {
			this.useLocalStore = false;
		}
*/ 

	    this.songStore = Ext.create('Ext.data.JsonStore', {
			fields: ["id","description","name","beats","bars","rows","rhythm"],
			sorters: [{property: 'name', transform: function(val){ return val.toLowerCase();}}],
			proxy: { type: 'memory'}
	    });

        this.mainView = new Ext.Container({ autoScroll: true, items: this.getSonglistView()});
		this.items = this.mainView;			

		App.Main.superclass.constructor.call(this, this.config);
		try {
			this.reloadDataFromServer();
			Ext.Function.defer(function() {
				var s = new App.Sound();
				Ext.Function.defer(s.playNote, 200, s, ['djembe', 'b']);
				Ext.Function.defer(s.playNote, 700, s, ['djembe', 'ss']);
				Ext.Function.defer(s.playNote, 900, s, ['djembe', 't']);
				Ext.Function.defer(s.playNote, 1100, s, ['djembe', 's']);
				Ext.Function.defer(s.playNote, 1200, s, ['bell', 'h']);
				Ext.Function.defer(s.playNote, 1600, s, ['bell', 'l']);
			}, 100);
		}catch(e) {}
	},
	
	reloadDataFromServer: function() {
		var current = '';
		var rec = null;

		if(this.useLocalStore) {
			this.songListStore.load();

			rec = this.songListStore.getAt(this.songListStore.findBy(function(record) {
				return record.get('name') != 'mydata';
			}));
			if(rec!= null) {
				current = rec.get('name');
				// load data since they may not be more recent data on server
				this.songStore.loadData(rec.get('data'));
			}
		}
		
		Ext.Ajax.request({
			url: this.centralServerUrl + 'getSongList',
			scope: this, 
			params: {current: current},
			callback: function(options, success, response){
				if(success) {
					try {
						var oData = Ext.decode(response.responseText);
						if(oData != null && oData.name != null && oData.name != current) {
							this.originalData = oData.data;
							if(this.useLocalStore) {
								if(rec != null) {
									rec.set('name', oData.name);
									rec.set('data', oData.data);
									rec.commit();
								} else
									this.songListStore.add(oData.data);

								this.songListStore.commitChanges();
								oMain.showMessage(_('MSG_NEW_DATA_ON_SERVER_TEXT'), _('MSG_NEW_DATA_ON_SERVER_TITLE'), true);
							}
							this.songStore.loadData(oData.data);
						}
					} catch (e){ }
				}
			}
		});
	},

	getSonglistView: function() {
		var options = this.createOptionsBtn([
			{ text: _('BTN_SONG_ADD'), scope: this, handler: function() { this.showView(function() {return Ext.create('App.SongwriterTpl'); }); } },
			{ text: _('BTN_PARSE'), scope: this, handler: function() { this.showView(function() { return Ext.create('App.Parser'); }); }, visible: this.useLocalStore },
			{ text: _('BTN_SONG_SAVE'), scope: this, handler: this.saveChanges } 
		], true);
		
		var dv = Ext.create('Ext.view.View', {
			store: this.songStore,
			itemSelector: 'span.thumb-wrap',
			trackOver: true,
			overItemCls: 'x-item-over',
			listeners: {
				scope: this,
				itemclick: function(view, record, item, index, e, eOpts ){
					this.showView(function() {return Ext.create('App.SongwriterTpl', {song: Ext.create('Song', record.data)})});
				}
			},
			tpl: new Ext.XTemplate(
				'<tpl for=".">',
					'<span class="thumb-wrap" id="{id}">',
					  '<img src="/img/djembe3.png" title="{description}" />',
					  '<br/><span>{name}</span>',
					'</span>',
				'</tpl>')
		});

		var p = Ext.create('Ext.Container', { items: [ 
			Ext.create('Ext.Container', {layout: 'hbox', items: [
				Ext.create('Ext.Container', { style: 'padding: 10px;', items: options}),
				Ext.create('Ext.Container', {html: '<div style="font-size: 16px; font-weight: bold; padding: 15px;">' + _('LBL_MAIN_HEADER') + '</div>'})
			]}),
			dv]}); 

		return p;
	},

	notifySongChanged: function(song, deleted) {
		var id = song.get("id");
		if(!deleted) {		
			var index = this.songStore.findExact( "id", id);
			if(index != -1) {
				var rec = this.songStore.getAt(index);
				rec.set("description", song.get("description"));
				rec.set("name", song.get("name"));
				rec.set("beats", song.get("beats"));
				rec.set("bars", song.get("bars"));
				rec.set("rows", song.get("rows"));
				rec.set("rhythm", song.get("rhythm"));	
				if(rec.getChanges().name != null) {
					this.songStore.sort();
				}

			} else {
				this.songStore.addSorted(song);
			}
 		}
	},
	
	hasChanges: function() {
		var a = this.songStore.getNewRecords();
		var m = this.songStore.getModifiedRecords();
		var r = this.songStore.getRemovedRecords();
		return (r.length + a.length + m.length > 0);
	},
	
	saveChanges: function() {		
		if(this.hasChanges()) {
			var oRows = [];
			this.songStore.each(function(rec){
				oRows.push(rec.getData());
			}, this);
			Ext.Msg.prompt(_('MSG_SONG_SAVE_CONFIRM_TITLE'), _('MSG_SONG_SAVE_CONFIRM_MESSAGE'),function(id, text) {
				 	if(id == 'ok') {
						Ext.Ajax.request({
							url: this.centralServerUrl + 'putSongList',
							scope: this, 
							params: {rows: Ext.encode(oRows), comment: text},
							callback: function(options, success, response){
								if(success) {
									this.songStore.commitChanges();
									var oData = Ext.decode(response.responseText);
									var msg = _('MSG_SONG_SAVE_SUCCESS');
									if(!oData.mailsent) {
										msg += _('MSG_SONG_SAVE_MAIL_FAILED');
									}
									oMain.showNotice(msg);
									
								} else {
									oMain.showNotice(_('MSG_SONG_SAVE_FAILED'), 'error');
								}
							}
						});
				 	}
				}, this);
		} else {
			oMain.showNotice(_('MSG_SONG_SAVE_NOCHANGE'));			
		}
/*
		
		var r = this.songStore.getRange();
		var o = this.originalData;
		var r = [];
		var changes = [];
		for(var i = 0; i < o.length; i++){
			for(var j = 0; j < c.length; j++){
				if(o[i].id == c[j].data.id) { // same some lets compare
					if(Ext.encode(o[i]) != Ext.encode(c[j].data))
console.info(Ext.encode(o[i]));
console.info(Ext.encode(c[j].data));
return;
				}
			}
		}
 */
	},

	setClipboard: function(r) {
		this.clipboard = r;
	},

	getClipboard: function() {
		return this.clipboard;
	},

	createOptionsBtn: function(buttons, noClose) {
		var btns = buttons || [];
		if(!noClose)
			btns.unshift({ text: _('BTN_CLOSE'), handler: this.showMainView });
		return Ext.create('Ext.button.Split', {
			scale: 'large',
			text: _('BTN_OPTIONS'),
			handler: function() { this.showMenu(); },
			menu: new Ext.menu.Menu({ items: btns })
		});
	},
	
	showView: function(fCreate) {
		this.mainView.removeAll();
		this.mainView.add(fCreate());
	},
	
	showMainView: function() {
		if(oMain.hasChanges ()) {
			oMain.showNotice(_('MSG_DATA_CHANGED_SAVE_REQUIRED'));
		} 
		oMain.mainView.removeAll();
		oMain.mainView.add(oMain.getSonglistView());
	},
	
	getPlayer: function() {
		if(this.player == null)
			this.player = new App.Sound();
		return this.player;
	},

	showNotice: function(msg, lvl) {
		var clsTypes = {
				info: 'background-color: #efefef;',
				warn: 'background-color: #efffff;',
				error: 'background-color: #ffefef;'
		};
		var cls = clsTypes[lvl] || clsTypes['info'];
		var w = new Ext.Window({ shadow: false, resizable: false, baseCls: '', style: "padding: 20px; border: 2px solid #dddddd; " + cls, html: msg });
		w.show();
		w.anchorTo(oMain, 'br-br', [-10, -20]);
		Ext.defer(function() {
			w.close();
	    }, 5000);
	},
	
	showMessage: function(msg, title, bAlert, options) {
		Ext.Msg.alert(title, msg); 
	}
	
});

Ext.apply(Ext.Panel.prototype, {                       
	frame: false,
	border: false
});  
