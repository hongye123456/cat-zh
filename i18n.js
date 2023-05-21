/**
 * FOR FULL I18N!
 */

//Localization support
dojo.declare("com.nuclearunicorn.i18n.Lang", null, {
	fallbackLocale: "zh",
	availableLocales: null,
	availableLocaleLabels: null,
	language: null,
	messages: null,
	_deffered: null,
	platformLocale: null,

	//TODO: move to the configuration file
	constructor: function(){
		var config = new classes.KGConfig();
		this.availableLocales = [this.fallbackLocale];

		console.log("Available locales:", config.statics.locales);
		for (var i in config.statics.locales ){
			this.availableLocales.push(config.statics.locales[i]);
		}

		this.availableLocaleLabels = {
			"en" : "English",
			"ru": "Русский",
			"zh": "中文",
			"ja": "日本語",
			"br": "Português",
			"es": "Español",
			"fr": "Français",
			"cz": "Čeština",
			"pl": "Polski"

		};
	},

	init: function(timestamp){
		var self = this;
		if (navigator.globalization  !== undefined) {
			var def = $.Deferred();

			navigator.globalization.getPreferredLanguage(
				function (language) {
					//console.log("platform locale:", language);
					self.platformLocale = language.value;

					def.resolve();
				},
				function (err) {
					console.error("Unable to get platform locale", err);
					def.resolve();
				}
			);
			return def.promise().then(function(){return self._init(timestamp);});
		} else {
			return this._init(timestamp);
		}
	},

	_init: function(timestamp) {
		if (this._deffered) {
			return this._deffered.promise();
		}
		// check if user already selected the locale
		var lang = LCstorage["com.nuclearunicorn.kittengame.language"];
		if (!lang || !this.isAvailable(lang)) {

			//console.log("navigator:", navigator, "platform:", this.platformLocale);
			var defaultLocale = this.platformLocale || navigator.language || navigator.userLanguage;
			// find closes match
			var parts = defaultLocale.split("[-_]");
			lang = this.fallbackLocale;

			for (var j = 0; j < this.availableLocales.length; j++) {
				if (this.availableLocales[j] == parts[0].toLowerCase()) {
					lang = this.availableLocales[j];
					break;
				}
			}
			LCstorage["com.nuclearunicorn.kittengame.language"] = lang;
		}
		// at this point we always have correct lang selected
		this.language = lang;
		var self = this;
		this._deffered = $.Deferred();
		// now we can try to load it
		var defferedForDefaultLocale = $.getJSON( "res/i18n/" + this.fallbackLocale + ".json?_=" + timestamp);
		defferedForDefaultLocale.fail(function(def, errMrs, err){
			console.error("Couldn't load default locale '", self.fallbackLocale, "', error:", errMrs, ", details:", err);
			self._deffered.reject("Couldn't load default locale");
		});
		var fallbackLocale = this.fallbackLocale;
		if (this.language != fallbackLocale ) {
			var defferedForUserLocale = $.getJSON( "res/i18n/" + lang + ".json?_=" + timestamp).fail(function(e){
				console.error("Couldn't load user locale '" + lang + "', error:", e);
			});

			$.when(defferedForDefaultLocale, defferedForUserLocale).then(function(fallbackLocale, userLocale) {
				console.log("locale arguments:", arguments);
				// merge locales
				$.extend( fallbackLocale[0], userLocale[0] );
				self.messages = fallbackLocale[0];
				self._deffered.resolve();
			}, function(e1, e2) {
				if (defferedForDefaultLocale.state() == "resolved") {
					// default locale was loaded correctly
					self.messages = fallbackLocale;
					self._deffered.resolve();
				}
			});
		} else {
			defferedForDefaultLocale.done(function(fallbackLocale) {
				self.messages = fallbackLocale;
				self._deffered.resolve();
			});
		}

		return this._deffered.promise();
	},

	getAvailableLocales: function() {
		return this.availableLocales;
	},

	getAvailableLocaleLabels: function() {
		return this.availableLocaleLabels;
	},

	getLanguage: function() {
		return this.language;
	},

	updateLanguage: function(lang) {
		this.language = lang;
		LCstorage["com.nuclearunicorn.kittengame.language"] = lang;
	},

	isAvailable: function(lang) {
		for (var i = 0; i < this.availableLocales.length; i++) {
			if (this.availableLocales[i] == lang) {
				return true;
			}
		}
		return false;
	},

	msg: function(key, args) {
		var msg = this.messages[key];
		if (!msg) {
			console.error("Key '" + key + "' wasn't found");
			return "$" + key;
		}

		if (args) {
			for (var i = 0; i < args.length; i++) {
				msg = msg.replace("{" + i + "}", args[i]);
			}
		}
		return msg;
	}
});

i18nLang = new com.nuclearunicorn.i18n.Lang();
// i18nLang.init();

$I = function(key, args) {
	return i18nLang.msg(key, args);
};