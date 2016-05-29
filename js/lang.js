Ext.namespace('App');
App.lang={ 	get:function(key, params){
		var lang = 'en';
		if(App.lang[lang] != null && App.lang[lang][key] != null)
			return Ext.String.format(App.lang[lang][key], params);
//			return '*' + Ext.String.format(App.lang[lang][key], params) + '*';
		return Ext.String.format('[{0}] {1}', lang, key); 
	},
	en: {
		'LBL_MAIN_HEADER': 'Gx Djembe notation tool',
		'BTN_DOT_NOTATION': 'Dot notation',
		'BTN_LETTER_NOTATION': 'Letter notation',
		'BTN_SONG_ADD': 'Compose new song',
		'BTN_SONG_SAVE': 'Save',
		'BTN_SONG_DELETE': 'Delete',
		'LBL_SONG_NAME': 'Name',
		'LBL_SONG_LENGTH': 'Length',
//		'LBL_SONG_ROWS': 'Rows',
//		'LBL_SONG_BEATS': 'Beats',
//		'LBL_SONG_BARS': 'Bars',
		'SYM_RIGHT': 'R',
		'SYM_LEFT': 'L',
		'SYM_BASS': 'B',
		'SYM_TONE': 'T',
		'SYM_SLAP': 'S',
		'SYM_BASS_FLAM': 'BB',
		'SYM_TONE_FLAM': 'TT',
		'SYM_SLAP_FLAM': 'SS',
		'SYM_PULSE': '-',
		'SYM_LOW': 'L',
		'SYM_HIGH_MUFFLED': 'HM',
		'SYM_LOW_MUFFLED': 'LM',
		'SYM_HIGH': 'H',
		'MSG_SONG_SAVE_CONFIRM_TITLE': 'Send changes to server',
		'MSG_SONG_SAVE_CONFIRM_MESSAGE': 'You changes will be sent to server and a moderator notified. Once approved they will be published. You can add a message below to be sent with the notofication',
		'MSG_SONG_SAVE_NOCHANGE': 'No changes to save',
		'MSG_SONG_SAVE_SUCCESS': 'Saved succesfully.',
		'MSG_SONG_SAVE_MAIL_FAILED': ' However there may have been a problems sending the email notification.',
		'MSG_SONG_SAVE_FAILED': 'Saved failed!',			
		'MSG_SONG_DELETE_SUCCESS': 'Deleted succesfully.',
		'MSG_SONG_DELETE_FAILED': 'Delete failed!',			
		'MSG_SONG_DELETE_CONFIRM_TITLE': 'Delete song?',
		'MSG_SONG_DELETE_CONFIRM_MESSAGE': 'Are you sure you want to delete this song?',
		'MSG_SONG_CLOSE_CONFIRM_TITLE': 'Close and loose changes?',
		'MSG_SONG_CLOSE_CONFIRM_MESSAGE': 'There are unsaved changes, do you want to save first?',
		'BTN_BACKUP': 'Backup',
		'BTN_RESTORE': 'Restore',
		'LBL_DJEMBE_INSTRUMENT': 'Djembe',			
		'LBL_TEMPO': 'Tempo',			
		'LBL_PLAYER': 'Player',		
		'LBL_PARSER': 'Parser',
		'BTN_PARSE': 'Parse',
		'BTN_PARSE_INSERT_EXAMPLE': 'Insert example',
		'MSG_PARSER_INVALID_TITLE': 'Parsing error',
		'MSG_PARSER_INVALID_LINE_NUMBERS': 'Line numbers incorrect',
		'MSG_PARSER_INVALID_EMPTY': 'Empty text',
		'MSG_PARSER_INVALID_BEATS_LENGTH': 'Number of beats do not match',
		'MSG_PARSE_INSTRUCTION': 'Paste or type text below in the format of the example, case is insensitive. Extra whitespaces will be ignored and the following characters will be accepted.<br />[B] = Bass&nbsp;&nbsp;&nbsp;&nbsp;[T] = Tone&nbsp;&nbsp;&nbsp;&nbsp;[S] = Slap&nbsp;&nbsp;&nbsp;&nbsp;[P.-] = Pulse&nbsp;&nbsp;&nbsp;&nbsp;[R] = Right&nbsp;&nbsp;&nbsp;&nbsp;[L] = Left&nbsp;&nbsp;&nbsp;&nbsp;[F] = Flam',
		'MSG_PARSE_EXAMPLE': 'Song name\n\nRhythm1 title\n\tB.ST.S..\n\tR.FL.L..\n\nRhythm2 title\n\tB....S..\n\tR....L..',	
		'LBL_EDITMODE_TITLE': 'Change edit mode',
		'LBL_EDITMODE_MSG': 'Swich edit mode and {0} changes?',
		'LBL_EDITMODE_ENABLE': 'allow',
		'LBL_EDITMODE_DISABLE': 'disallow',
		'BTN_OK': 'Ok',
		'BTN_CANCEL': 'Cancel',
		'LBL_ANNOTATION': 'Description and notes',
		'BTN_SONG_PRINT': 'Print',
		'LBL_PRINT_TITLE': 'Print (A4 optimised)',
		'BTN_OPTIONS': 'Options',
		'BTN_CLOSE': 'Close',
		'BTN_COPY': 'Copy',
		'BTN_PASTE': 'Paste',
		'MSG_NEW_DATA_ON_SERVER_TITLE': 'Data updated',
		'MSG_NEW_DATA_ON_SERVER_TEXT': 'More recent songs have been found on server and sonds updated',
		'BTN_ROW_DELETE': 'Delete',
		'BTN_ROW_ADD': 'Add row',
		'BTN_HAND_START_LEFT': 'Start with left', 
		'BTN_HAND_START_RIGHT': 'Start with right',
		'MSG_DATA_CHANGED_SAVE_REQUIRED': 'Changes have been made remenber to save.',
		'BTN_ROW_TYPE': 'Type',
		'LBL_KENNENI_INSTRUMENT': 'Kenneni',
		'LBL_SANGBAN_INSTRUMENT': 'Sangban',
		'LBL_DOUNDOUN_INSTRUMENT': 'Doun doun',
		'LBL_BELL_INSTRUMENT': 'Bell',
		
		d:'d'
	}
}
