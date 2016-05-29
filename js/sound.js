Ext.define('App.Sound', { extend: 'Ext.window.Window',
   constructor : function(config){
        this.config = config || {};
        this.config.closeAction = 'hide';
        this.config.title = _('LBL_PLAYER');
        this.config.minWidth = 250;
        this.config.resizable = false;

		this.tempo = 70;  // tempo is stored as a percent 
        this.beat = 0;
		var fp = '/wav_samples/';
        
        this.soundbank = {
        		djembe: {
        			b: fp + 'djembe_bass.wav',
        			bb: fp + 'djembe_bass.wav',
        			t: fp + 'djembe_tone.wav',
        			tt: fp + 'flam.wav',
        			s: fp + 'djembe_slap.wav',
        			ss: fp + 'slap_flam.wav'
        		},
        		bell: {
        			t: fp + 'bell_low.wav',
        			tt: fp + 'bell_low_muffled.wav',
        			s: fp + 'bell_high.wav',
        			ss: fp + 'bell_high_muffled.wav'
        		},
        		doundoun: {
        			b: fp + 'dundun.wav',
        			t: fp + 'dundun_muffled.wav'
        		},
        		sangban: {
        			b: fp + 'dundun.wav',
        			t: fp + 'dundun_muffled.wav'
        		},
        		kenneni: {
        			b: fp + 'dundun.wav',
        			t: fp + 'dundun_muffled.wav'
        		}
        };
		// dl to cache
        this.sounds = {};
    	for(var type in this.soundbank) {
			this.sounds[type] = {};
	    	for(var key in this.soundbank[type]) {
				 this.sounds[type][key] = new Audio();
				 this.sounds[type][key].src = this.soundbank[type][key];
				 this.sounds[type][key].volume = 0.99;
				 this.sounds[type][key].load();
	    	}
    	}
    	
    	this.leds = new Ext.container.Container({
			padding: 10,
			tpl: new Ext.XTemplate(
			    '<tpl for=".">' +
			        '<div style="display: inline-block;">' +
				        '<div class="sequencerNum">{#}</div>' +
				        '<div class="sequencerPosition {cls}"></div>' +
			        '</div>' +
			    '</tpl>'
			)
    	});
    	
		this.playBtn = new Ext.Container({
			style: 'border: 1px solid black; padding: 2px; cursor: pointer;' ,
			htmlTpl: '<img src="/img/{0}.png"  />' ,
			setText: function(btn, img) {
				if(!btn.rendered)
					btn.html = btn.htmlTpl.replace('{0}', img);
				else
					btn.update(btn.htmlTpl.replace('{0}', img));
			},
			listeners: {
				scope: this,
				'afterrender': function(cmp) {
					cmp.el.on('click', function() {
						this.togglePlay();
					}, this);
					cmp.setText(cmp, 'play');
				}
			}
		}); 
		this.tempoBtn = new Ext.slider.Single({
			fieldLabel: _('LBL_TEMPO'),
			labelWidth: 50,
			flex: 1,
	        value: this.tempo,
			tipText: function(thumb){ 
				return thumb.value;
            },
	        listeners: {
	            scope: this,
	            change: function(field, value) {
	                this.tempo = value;
					if(this.isPlaying){
						this.togglePlay(true);
						this.togglePlay(true);
					}
        		}
        	}
        });

    	this.controls = new Ext.container.Container({ padding: 10, layout: 'hbox', items: [
    		this.playBtn, new Ext.container.Container({width: 10}), this.tempoBtn
    	]});
    	
    	this.items = [this.controls, this.leds];
		
		App.Sound.superclass.constructor.call(this, this.config);
		this.on('show', function() {this.renderTemplate();}, this);
		this.on('hide', function() {if(this.isPlaying) this.togglePlay();}, this);
    },
    
    update: function(rhythm) {
    	this.rhythm = rhythm;
    	this.setTitle(_('LBL_PLAYER') + ' ' + this.rhythm.description);
    	this.sequence = [];
		for(var i = 0; i < this.rhythm.length; i++) {
			for(var j = 0; j < this.rhythm[i].notes.length; j++) {
				this.sequence[j] = this.sequence[j] || { notes: {} };	
				var key = this.rhythm[i].notes[j];
    			if(key != 'p')
					if(this.sequence[j].notes[key] == null) {
						this.sequence[j].notes[key] = new Audio();
						 this.sequence[j].notes[key].src = this.soundbank[this.rhythm[i].type][key];
						 this.sequence[j].notes[key].load();
					}
			}	
		}
		this.renderTemplate();
		this.doLayout();
    },
    
    renderTemplate: function() {
    	var w = (this.sequence.length * 24) + 31;
		if(this.rendered && this.getWidth() != w)
			this.setWidth(w);
		var leds = [];
		for(var i = 0; i < this.sequence.length; i++) 
			leds[i] = {pos: i + 1, cls: i == this.beat && this.isPlaying ? ' sequencerPositionOn' : ''};
		this.leds.update(leds);
    },
    
    togglePlay: function(bContinue) {
		if(!bContinue) 
			this.beat = 0;

		Ext.TaskManager.stopAll();
    	if(this.isPlaying) {
			this.playBtn.setText(this.playBtn, 'play');
    		this.isPlaying = false;
    		this.beat = 0;
    	} else {
			this.playBtn.setText(this.playBtn, 'stop');
    		this.isPlaying = true;
			Ext.TaskManager.start({
			    run: this.playBeat,
			    interval: (((this.tempo-100)*-1)*5)+50, // tempo is stored as a percent, this calculates it to a tange of 50 to 550 whis is interpreted as milliseconds delay
			    scope: this
			});
    	}
		this.renderTemplate();
    },
    
    playBeat: function() {
		this.renderTemplate();

    	if(this.sequence != null && this.sequence[this.beat] != null && this.sequence[this.beat].notes != null) 
    		for(var key in this.sequence[this.beat].notes) 
		    	if(this.sequence[this.beat].notes[key] != null) 
	    			this.sequence[this.beat].notes[key].play();

		this.beat++;
		if(this.beat >= this.sequence.length)
			this.beat = 0;
    },
    
    playNote: function(type, key) {
    	if(this.sounds[type] != null && this.sounds[type][key] != null)
    		this.sounds[type][key].play();
    }

});
