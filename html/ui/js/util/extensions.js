var __entityMap = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': '&quot;',
	"'": '&#39;',
	"/": '&#x2F;'
};

String.prototype.escapeHTML = function() {
	return String(this).replace(/[&<>"'\/]/g, function(s) {
		return __entityMap[s];
	});
}

String.prototype.unescapeHTML = function() {
	return String(this).replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace('&quot;', '"').replace('&#39;', "'").replace('&#x2F;', "/");
}

String.prototype.nl2br = function() {
	return String(this).replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br />$2');
}

String.prototype.capitalize = function() {
	return this.charAt(0).toUpperCase() + this.slice(1);
}

Number.prototype.pad = function(size) {
	var s = String(this);
	if (typeof(size) !== "number") {
		size = 2;
	}

	while (s.length < size) {
		s = "0" + s;
	}
	return s;
}