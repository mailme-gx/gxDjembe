Ext.namespace('App');

App.MessagePanel=Ext.extend(Ext.Container, {
	constructor: function(config){
		this.config = config || {};
		this.config.fadeDuration = this.config.fadeDuration || 3;	
		this.config.hiColor = this.config.hiColor || 'ffffcc';
		this.config.loColor = this.config.loColor || 'dfe8f6';
		if(this.config.unstyled == null){
			this.config.unstyled = true;
		}
		this.config.layout = this.config.layout || 'hbox';
		this.config.height = this.config.height || 22;
		if(this.config.hideMsg==null){
			this.config.hideMsg = true;
		}
		this.config.hidden = this.config.hideMsg;
		this.config.style = this.config.style || 'margin: 0px; padding: 0px; background-color: #' + this.config.loColor + ';';
		this.pTxt = new Ext.Container({height: this.config.height, html: '', flex: 1, style: 'padding: 4px 2px 2px 8px;'});

		this.bClose = new Ext.Button({ cls: 'imageButton', iconCls: 'messageCloseButton', scope: this, handler: this.clear, hidden: true });
		this.items = [this.pTxt, this.bClose];		
		App.MessagePanel.superclass.constructor.call(this, this.config);		
	},

	showMessage:function(cMessage, bNoFade, bNoHide, cookie, duration, closable){
		if(Ext.isObject(cMessage)) {
			cMessage = cMessage.cMessage;
			bNoFade = cMessage.bNoFade;
			bNoHide = cMessage.bNoHide;
			cookie = cMessage.cookie;
			duration = cMessage.duration;
			closable = cMessage.closable;
		}
		var bShowMsg = true;
		if (cookie != null) {
			var val = Ext.util.Cookies.get(cookie);
			if (val != null)
				bShowMsg = false;
			else 
				this.on('hide', function(cmp){
					Ext.util.Cookies.set(cookie, 'true');
				}, this);
		}	
			
		if(bShowMsg) {
			this.show();
			this.bClose.setVisible(bNoHide);

			//an additional property to hide the button only
			if(closable != null && closable == false){
				this.bClose.setVisible(false);				
			}
			
			if(this.pTxt.rendered)
				this.pTxt.update(cMessage);
			else
				this.on('afterrender', function(panel) {this.pTxt.update(cMessage);}, this, {single: true});
			
			if(this.ownerCt != null && this.ownerCt.doLayout != null)
				this.ownerCt.doLayout();
			else
				this.doLayout(); 
			
			if(bNoFade !== true) 
				this.el.highlight(this.config.hiColor, { endColor: this.config.loColor, attr: 'background-color', duration: (duration || this.config.fadeDuration)  });
			
			if(bNoHide !== true) 
				this.clear.defer((duration || this.config.fadeDuration) * 1000, this);
		}
	}, 
	
	clear: function() {
		if (this.pTxt.rendered)
			this.pTxt.update('');
		if(this.config.hideMsg){
			this.hide(true);					
		}	
		if(this.ownerCt != null && this.ownerCt.doLayout != null)
			this.ownerCt.doLayout();
		else
			this.doLayout(); 
	}
	
});
