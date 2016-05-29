
Ext.define('App.Admin', { extend: 'Ext.container.Viewport',
	constructor: function(config){
		this.config = config || {};
		this.layout = 'fit';
		this.autoScroll = true;

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
/*
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
        this.mainPanel = new Ext.Panel({ autoScroll: true, layout: 'hbox', tbar: [' ', this.filesSelect, new Ext.Container({width: 20}), this.songsSelect, new Ext.Container({id: 'compare', width: 20})] }); //, options] });
*/
        this.mainPanel = new Ext.Panel({ autoScroll: true, layout: 'hbox' });

        this.items = this.mainPanel;
        
		this.superclass.constructor.call(this, this.config);
		this.getBaseData();
		this.getAllFiles();
	},

	
	formatDisplayFilename: function(name) {
		if(name != null && name.length > 14) {
			name = name.substr(0, 4) + '.' + name.substr(4, 2) + '.' + name.substr(6, 2) + ' ' + name.substr(8, 2) + ':' + name.substr(10, 2);
		}
		return name;
	},

	getBaseData: function() {
		Ext.Ajax.request({
			url: this.centralServerUrl + 'getSongList',
			scope: this, 
			callback: function(options, success, response){
				if(success) {
					this.baseFile = Ext.decode(response.responseText);
					for(var i in this.baseFile.data) {
						if(this.baseFile.data[i].rhythm != null) {
							this.baseFile.data[i].rhythm = Ext.decode(this.baseFile.data[i].rhythm);
						}
					}
				}
			}
		});
	},
	
	getAllFiles: function() {
		Ext.Ajax.request({
			url: this.adminServerUrl + 'getFilesData',
			scope: this, 
			callback: function(options, success, response){
				if(success) {
					var oData = Ext.decode(response.responseText);
					if(oData != null && oData.files != null) {
						this.files = oData.files;
						for(var o in this.files) {
							if(this.files[o].length > 0) {
								for(var i in this.files[o]) {
									if(this.files[o][i].rhythm != null) {
										this.files[o][i].rhythm = Ext.decode(this.files[o][i].rhythm);
									}
								}
							}
						}
						this.mainPanel.removeAll();
						this.treePanels = {};
						this.treePanels['Merged'] = this.getTreePanel('Merged');
						this.treePanels['Merged'].setJson({base: this.baseFile, merges: {}});
						this.mainPanel.add(this.treePanels['Merged']);
						for(var o in this.files) {
							this.treePanels[o] = this.getTreePanel(o);
							this.mainPanel.add(this.treePanels[o]);
						}
					}
				} 
			}
		});
	},
	
	getTreePanel: function(name) {
		var options = name == 'Merged' ? [
		    { text: 'Discard merged changes', scope: this, handler: function(){window.location.reload();} },
		    { text: 'Save merged changes', scope: this, handler: this.saveChanges }
		] : [
		    { text: 'Show diff merge', scope: this, handler: function () { 
		    	this.treePanels[name].setJson({data: this.files[name], diff: this.getFileDiff(this.baseFile.data, this.files[name]) }); 
		    } },
		    { text: 'Merge into base', scope: this, handler: function () { this.doMerge(name); } },
			{ text: 'Set as base version', scope: this, handler: function() { this.fileAccept(true, name); } },
			{ text: 'Reject file', scope: this, handler: function() { this.fileAccept(false, name); } }
		];
		
		return new App.jsonTree({ border: true, bodyPadding: 2, title: name, // json: name == 'Merged' ? {} : this.files[name], 
			tools: [ { type: 'gear', handler: function() { var m = new Ext.menu.Menu({ items: options }); m.showBy(this); } } ]
		});
	},
	
	getFileDiff: function(l, r) {
		var ret = {};
		for(var i = 0; i < l.length; i++) {
			var ls = l[i];
			var rs = this.getSong(r, ls.name);
			ret[ls.name] = this.getSongsDiff(ls, rs);
		}
		this.removeEmptyKeys(ret);
		return ret;
	},
	
	getSongsDiff: function(l, r) {
		if(r == null) {
			return 'removed song';
		}
		// ignore obsolete keys i.e. rows and bars
		var diffs = {};
		for(var o in l) {
			if(o != 'bars' && o != 'rows') {
				if(r == null || r[o] == null) {
					diffs[o] = 'removed';
				} else if(l[o] != r[o]) {
					if(o == 'rhythm') {
//						diffs[o] = this.getRhythmsDiff(Ext.decode(l[o]), Ext.decode(r[o]));
						diffs[o] = this.getRhythmsDiff(l[o], r[o]);
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
	
	getSong: function(data, name) {
		if(data) {
			for(var i = 0; i < data.length; i++) {
				if(data[i].name == name) {
					return data[i];
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
	
	doMerge: function(name) {
		if(this.merges != null && this.merges[name] != null) {
			return Ext.Msg.alert('', 'File already been merged!'); 			
		}
		var data = this.files[name];
		if(this.baseFile && this.baseFile.data && data) {
			this.merges = this.merges || {};
			this.merges[name] = this.mergeObjects(this.baseFile.data, this.merged || this.baseFile.data, data);
			this.merged = this.merges[name].merged;
			this.treePanels['Merged'].setJson({newBase: this.merged, merges: this.merges});
			if(this.merges[name].conflicts != null) {
				Ext.Msg.alert('', 'File ' + name + ' merge has conflicts!'); 			
			}
		}
	},
	
	fileAccept: function(accepted, name) {
		var fn = name;
        if(fn == null || fn.length == 0) {
			return Ext.Msg.alert('', 'No File selected!'); 
		}
		Ext.Msg.confirm('Are you sure?', (accepted ? 'This version will become the default from now on' : 'This file will be rejected') + ':<br />' + fn, function(id) {
			if(id == 'yes') {
				Ext.Ajax.request({
					url: this.adminServerUrl + (accepted ? 'accept' : 'reject') + 'File&name=' + fn,
					scope: this, 
					callback: function(options, success, response){
						var b = false;
						if(success) {
							var oData = Ext.decode(response.responseText);
							if(oData.success != null && oData.success === true) {
								b = true;
							}
						}
						Ext.Msg.alert('', 'Action ' + (b? 'success' : 'failed!'), b? function(){window.location.reload();} : null); 
					}
				});
			}
		}, this);
/*
	},
	
	toPrettyJsonHtml: function(obj) {
		return this.toPrettyJsonString(obj).replace('\n', '<br />', 'g').replace('    ', '&nbsp;&nbsp;&nbsp;&nbsp;', 'g');
	},
	
	toPrettyJsonString: function(obj) {
		return JSON.stringify(obj, null, "    ");
	},
	
	showMessage: function(msg, title, bAlert, options) {
		Ext.Msg.alert(title, msg); 
	},
	
	mergeObjects: function(o, a, b, objOrShallow) {
	  var r, k, v, ov, bv, inR, isArray = Array.isArray(a), hasConflicts, conflicts = {}, newInA = {}, newInB = {}, updatedInA = {}, updatedInB = {}, keyUnion = {}, deep = true;
	  
	  if (typeof objOrShallow !== 'object') {
	    r = isArray ? [] : {};
	    deep = !objOrShallow;
	  } else {
	    r = objOrShallow;
	  }
	  
	  for (k in b) {
	    if (isArray && isNaN((k = parseInt(k)))) continue;
	    v = b[k];
	    r[k] = v;
	    if (!(k in o)) {
	      newInB[k] = v;
	    } else if (v !== o[k]) {
	      updatedInB[k] = v;
	    }
	  }
	  
	  for (k in a) {
	    if (isArray && isNaN((k = parseInt(k)))) continue;
	    v = a[k];
	    ov = o[k];
	    inR = (k in r);
	    if (!inR) {
	      r[k] = v;
	    } else if (r[k] !== v) {
	      bv = b[k];
	      if (deep && typeof v === 'object' && typeof bv === 'object') {
	        bv = this.mergeObjects((k in o && typeof ov === 'object') ? ov : {}, v, bv);
	        r[k] = bv.merged;
	        if (bv.conflicts) {
	          conflicts[k] = {conflicts:bv.conflicts};
	          hasConflicts = true;
	        }
	      } else {
	        if (bv === ov) {
	          // Pick A as B has not changed from O
	          r[k] = v;
	        } else if (v !== ov) {
	          // A, O and B are different
	          if (k in o)
	            conflicts[k] = {a:v, o:ov, b:bv};
	          else
	            conflicts[k] = {a:v, b:bv};
	          hasConflicts = true;
	        } // else Pick B (already done) as A has not changed from O
	      }
	    }
	    
	    if (k in o) {
	      if (v !== ov)
	        updatedInA[k] = v;
	    } else {
	      newInA[k] = v;
	    }
	  }
	  
	  r = {
	    merged:r,
	    added: { a: newInA, b: newInB },
	    updated: { a: updatedInA, b: updatedInB }
	  };
	  if (hasConflicts)
	    r.conflicts = conflicts;
	  return r;
*/
	}
});

Ext.define('App.jsonTree', { extend: 'Ext.tree.Panel',
	constructor: function(config){
		config = config || {};
		config.width = 250;
		config.lines = true;
		root = {text: 'JSON'};
		config.rootVisible = false;
		config.trackMouseOver = false;
		config.scroll = false;
		config.autoScroll = false;
		config.viewConfig = {
			listeners: {
					itemcontextmenu : function(view, node, el, index, e) {
						e.stopEvent();
						var menu = new Ext.menu.Menu({
							items: [{ text: 'Expand', handler: function () { node.expand(); } }, 
							        { text: 'Expand all', handler: function () { node.expand(true); } }, '-', 
							        { text: 'Collapse', handler: function () { node.collapse(); } }, 
							        { text: 'Collapse all', handler: function () { node.collapse(true); } }]
						});
						menu.showAt(e.getXY());
					}
			}
		};
		this.superclass.constructor.call(this, config);
		if(config.json) {
			this.setJson(config.json);
		}			
	},
	setJson: function(json){
		var root = this.getRootNode();
		root.removeAll();
		if(json != null && json instanceof Object && Object.keys(json).length > 0) {
			root.appendChild(this.json2leaf(json));
		}
	},
	json2leaf: function (json) {
		var ret = [];
		for (var i in json) {
			if (json.hasOwnProperty(i) && json[i] != null && typeof json[i] !== 'function') {
				if (typeof json[i] === 'object') {
					ret.push({text: (json[i].name || i), children: this.json2leaf(json[i]), icon: Ext.BLANK_IMAGE_URL });
				} else {
					ret.push({text: i + ' : "' + json[i] + '"', leaf: true, icon: Ext.BLANK_IMAGE_URL }); 
				}
			}
		}
		return ret;
	}
});

