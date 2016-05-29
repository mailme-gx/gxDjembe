
Ext.define('App.Admin', { extend: 'Ext.container.Viewport',
	constructor: function(config){
		this.config = config || {};
		this.layout = 'fit';

		this.centralServerUrl = '/?a=';
		this.adminServerUrl = '/admin/?a=';
/*
Merge notes

left panel should be called base
selecting a file adds a new column/file each time and a new diff
need a way to remove a column/file
column/file tbar should have accept/reject not globaly

OR
add option copy to base (does so only in js)
then switch files does a diff and you can copy again, this will overwrite conflicts so maybe we should cache the diff struct and use that to check for conflicts

*/


		this.todo = ['lots, just getting started'];

        this.filesSelect = this.getFilelist();
        this.songsSelect = this.getSonglist();
        this.leftPanel = new Ext.Container({columnWidth: 0.4 });
        this.rightPanel = new Ext.Container({columnWidth: 0.4});
        var options = new Ext.button.Split({
			text: _('BTN_OPTIONS'),
			handler: function() { this.showMenu(); },
			menu: new Ext.menu.Menu({
				items: [
					{ text: 'Accept file', scope: this, handler: function() {this.fileAccept(true);} },
					{ text: 'Reject file', scope: this, handler: function() {this.fileAccept(false);} }				
				]
			})
		});

        this.diffPanel = new Ext.Container({columnWidth: 0.2});
        this.items = new Ext.Panel({ autoScroll: true, layout: 'fit', items: new Ext.Container({ layout: 'column', items: [
			this.leftPanel, 
			this.rightPanel, 
			this.diffPanel
		] }), tbar: [' ', this.filesSelect, new Ext.Container({width: 20}), this.songsSelect, new Ext.Container({width: 20}), options] });
		this.getData();

		this.superclass.constructor.call(this, this.config);
	},

	getFilelist: function() {
		return Ext.create('Ext.form.ComboBox', {
			fieldLabel: 'Changed',
			labelWidth: 50,
			displayField: 'formatted',
			valueField: 'name',
			queryMode: 'local',
			editable: false,
			grow: true,
			store: new Ext.data.JsonStore({
				autoLoad: true,
				sortOnLoad: true, 
				sorters: [{property: 'name', direction: 'DESC'}],
				proxy: {
					type: 'ajax',
					url: this.adminServerUrl + 'getFilesName',
        			reader: {
            			type: 'json',
            			root: 'files',
        			}
				},
				fields: ['name', {name: 'formatted', convert: this.formatDisplayFilename}]
			}),
			listeners: {
				select: function(combo, records, eOpts) {
					if(records.length == 1) {
						this.loadFile(records[0]);
					}
				},
				scope: this
			}
		});
	},

	getSonglist: function() {
		return Ext.create('Ext.form.ComboBox', {
			fieldLabel: 'Song',
			labelWidth: 30,
			displayField: 'name',
			valueField: 'value',
			queryMode: 'local',
			editable: false,
			grow: true,
			store: new Ext.data.ArrayStore({
			   autoDestroy: true,
			   fields: [
				  {name: 'value', type: 'string'},
				  {name: 'name', type: 'string'}
			   ]
			}),
			listeners: {
				change: function(cmp, newValue, oldValue, eOpts ) {
					this.loadSong(newValue);
				},
				scope: this
			},
			load1D: function(arr) {
				var out = [];
				for(var i = 0; i < arr.length; i++) {
					out[i] = [arr[i].substr(0, arr[i].length - 2), arr[i]];
				}
				this.getStore().loadData(out);
			}
		});
	},
	
	formatDisplayFilename: function(v, rec) {
		var name = rec.get('name');
		if(name != null && name.length > 14) {
			name = name.substr(0, 4) + '.' + name.substr(4, 2) + '.' + name.substr(6, 2) + ' ' + name.substr(8, 2) + ':' + name.substr(10, 2);
		}
		return name;
	},

	loadFile: function(record) {
		this.getData(record.get('name'));
	},

	loadSong: function() {
		var fn = this.filesSelect.getValue();
        var sn = this.songsSelect.getValue();
        
        if(this.files[fn] != null && this.current != null) {
			
			this.rightPanel.removeAll();
			this.leftPanel.removeAll();
			this.diffPanel.update();
			var sL = this.getSong(this.current, sn);
			var sR = this.getSong(fn, sn);
			if(sL != null) {
				this.leftPanel.add(Ext.create('App.SongwriterTpl', {noOptions: true, song: Ext.create('Song', sL)}));
			}
			if(sR != null) {
				this.rightPanel.add(Ext.create('App.SongwriterTpl', {noOptions: true, song: Ext.create('Song', sR)}));
			}
			var diff = this.getSongsDiff(sL, sR);
			if(diff != null && Object.keys(diff).length != 0) {
				this.diffPanel.update(JSON.stringify(diff, null, "    ").replace('\n', '<br />', 'g').replace('    ', '&nbsp;&nbsp;&nbsp;&nbsp;', 'g'));
			}
		}		
	},

	getData: function(name) {
		this.files = this.files || {};
		if(!this.files[name]) {
			Ext.Ajax.request({
				url: name == null ? this.centralServerUrl + 'getSongList' : '/data/' + name,
				scope: this, 
				callback: function(options, success, response){
					if(success) {
						var oData = Ext.decode(response.responseText);
						if(name != null) {
							this.files[name] = oData;	
							this.doDiff(name);
						} else {
							this.files[oData.name] = oData.data;	
							this.current = oData.name;
						}
					}
				}
			});
		} else {
			if(name != null) {
				this.doDiff(name);
			}
		}
	},
	
	doDiff: function(name) {
		if(this.current && this.files[this.current] && this.files[name]) {
			var names = [];
			for(var i = 0; i < this.files[this.current].length; i++) {
				var cs = this.files[this.current][i];
				var fs = this.getSong(name, cs.name);

				if(fs == null) {
					names.push(cs.name + ' -');
				} else if(Object.keys(this.getSongsDiff(cs, fs)).length != 0) {
					names.push(cs.name + ' ~');
				} else {
					names.push(cs.name + ' =');
				}
			}
			for(var i = 0; i < this.files[name].length; i++) {
				if(!this.getSong(this.current, this.files[name][i].name)) {
					names.push(this.files[name][i].name + ' +');
				}				
			}
			names = Ext.Array.sort(names);
			this.songsSelect.setValue('');
			this.songsSelect.load1D(names);
		}
	},
	
	getSongsDiff: function(l, r) {
		// ignore obsolete keys i.e. rows and bars
		var diffs = {};
		for(var o in l) {
			if(o != 'bars' && o != 'rows') {
				if(r == null || r[o] == null) {
					diffs[o] = 'removed';
				} else if(l[o] != r[o]) {
					if(o == 'rhythm') {
						diffs[o] = this.getRhythmsDiff(Ext.decode(l[o]), Ext.decode(r[o]));
					} else {
						diffs[o] = l[o] + ' -> ' + r[o];
					}
				}
			}
		}
		for(var o in r) {
			if(o != 'bars' && o != 'rows' && diffs[o] == null) {
				if(l == null || l[o] != r[o]) {
					diffs[o] = 'added';
				}
			}
		}
		this.removeEmptyKeys(diffs);
		return diffs;
	},
	
	getRhythmsDiff: function(l, r) {
		var diffs = {};

		for(var i = 0; i < l.length; i++) {
			var lr = l[i];
			var rr = this.getRhythm(r, l[i].name);
			if(rr == null) {
				diffs[l[i].name] = 'removed';
			} else {
				diffs[l[i].name] = this.getRhythmDiff(lr, rr);
			}
		}
		for(var i = 0; i < r.length; i++) {
			var rr = r[i];
			var lr = this.getRhythm(l, r[i].name);
			if(lr == null) {
				diffs[r[i].name] = 'added';
			}
		}

		return diffs;
	},
	
	getRhythmDiff: function(l, r) {
		var diffs = {};
		for(var o in l) {
			if(r == null || r[o] == null) {
				diffs[o] = 'removed';
			} else if(l[o] != r[o]) {
				if(o == 'notes') {
					diffs[o] = {};
					if(l[o].length != r[o].length) {
						diffs[o].length = l[o].length + ' -> ' + r[o].length;
					} 
					for(var i = 0; i < Math.min(l[o].length, r[o].length); i++) {
						if(l[o][i] != r[o][i]){
							diffs[o][i + 1] = l[o][i] + ' -> ' + r[o][i];
						}
					}
				} else {
					diffs[o] = l[o] + ' -> ' + r[o];
				}
			}
		}
		return diffs;
	},
	
	getRhythm: function(rhythms, name) {
		for(var i = 0; i < rhythms.length; i++) {
			if(rhythms[i].name == name) {
				return rhythms[i];
			}
		}
		return null;		
	},
	
	getSong: function(file, name) {
		if(this.files[file]) {
			for(var i = 0; i < this.files[file].length; i++) {
				if(this.files[file][i].name == name) {
					return this.files[file][i];
				}
			}
		}
		return null;		
	},
	
	removeEmptyKeys: function(o) {
		if(o instanceof Object && !(o instanceof Array)) {
			for(var k in o) {
				if(o[k] instanceof Array) {
					for(var i = 0; i < o[k].length; i++) {
						this.removeEmptyKeys(o[k][i]);
					}
				} else if(o[k] instanceof Object) {
					this.removeEmptyKeys(o[k]);
				}// else 
				if(o[k] == null || (o[k] instanceof Object && Object.keys(o[k]).length == 0)) {
					delete o[k];
				}
			}
		}
	},
	
	fileAccept: function(accepted) {
		var fn = this.filesSelect.getValue();
        if(fn == null || fn.length == 0) {
			return Ext.Msg.alert('', 'No File selected!'); 
		}
		Ext.Msg.confirm('Are you sure?', (accepted ? 'This version will become the default from now on'  : 'This file will be rejected') + ':<br />' + fn, function(id) {
			if(id == 'yes') {
				Ext.Ajax.request({
					url: this.adminServerUrl + (accepted ? 'accept' : 'reject') + 'File&name=' + fn,
					scope: this, 
					callback: function(options, success, response){
						Ext.Msg.alert('', 'Action ' + (success ? 'success' : 'failed!'), success ? function(){/*window.location.reload();*/} : null); 
					}
				});
			}
		}, this);
	},
	
	showMessage: function(msg, title, bAlert, options) {
		Ext.Msg.alert(title, msg); 
	}
	
});
