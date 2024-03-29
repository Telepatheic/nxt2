var NRS = (function(NRS, $, undefined) {
	NRS.fetchingModalData = false;

	// save the original function object
	var _superModal = $.fn.modal;

	// add locked as a new option
	$.extend(_superModal.Constructor.DEFAULTS, {
		locked: false
	});

	// capture the original hide
	var _hide = _superModal.Constructor.prototype.hide;

	// add the lock, unlock and override the hide of modal
	$.extend(_superModal.Constructor.prototype, {
		// locks the dialog so that it cannot be hidden
		lock: function() {
			this.options.locked = true;
		}
		// unlocks the dialog so that it can be hidden by 'esc' or clicking on the backdrop (if not static)
		,
		unlock: function() {
			this.options.locked = false;
		}
		// override the original hide so that the original is only called if the modal is unlocked
		,
		hide: function() {
			if (this.options.locked) return;

			_hide.apply(this, arguments);
		}
	});

	//Reset scroll position of tab when shown.
	$('a[data-toggle="tab"]').on("shown.bs.tab", function(e) {
		var target = $(e.target).attr("href");
		$(target).scrollTop(0);
	})

	//hide modal when another one is activated.
	$(".modal").on("show.bs.modal", function(e) {
		var $visible_modal = $(".modal.in");

		if ($visible_modal.length) {
			$visible_modal.modal("hide");
		}
	});

	$(".modal").on("shown.bs.modal", function() {
		$(this).find("input[type=text]:first, input[type=password]:first").first().focus();
		$(this).find("input[name=converted_account_id]").val("");
	});

	//Reset form to initial state when modal is closed
	$(".modal").on("hidden.bs.modal", function(e) {
		$(this).find(":input:not([type=hidden],button)").each(function(index) {
			var default_value = $(this).data("default");
			var type = $(this).attr("type");

			if (type == "checkbox") {
				if (default_value == "checked") {
					$(this).prop("checked", true);
				} else {
					$(this).prop("checked", false);
				}
			} else {
				if (default_value) {
					$(this).val(default_value);
				} else {
					$(this).val("");
				}
			}
		});

		//Hidden form field
		$(this).find("input[name=converted_account_id]").val("");

		//Hide/Reset any possible error messages
		$(this).find(".callout-danger:not(.never_hide), .error_message, .account_info").html("").hide();
	});

	return NRS;
}(NRS || {}, jQuery));