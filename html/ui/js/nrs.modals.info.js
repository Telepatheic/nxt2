var NRS = (function(NRS, $, undefined) {
	$("#nrs_modal").on('show.bs.modal', function(e) {
		for (var key in NRS.state) {
			var el = $("#nrs_node_state_" + key);
			if (el.length) {
				if (key.indexOf("number") != -1) {
					el.html(NRS.formatAmount(NRS.state[key]));
				} else if (key.indexOf("Memory") != -1) {
					el.html(NRS.formatVolume(NRS.state[key]));
				} else if (key == "time") {
					el.html(NRS.formatTimestamp(NRS.state[key]));
				} else {
					el.html(String(NRS.state[key]).escapeHTML());
				}
			}
		}

		$("#nrs_update_explanation").show();
		$("#nrs_modal_state").show();

	});

	$("#nrs_modal").on('hide.bs.modal', function(e) {
		$("body").off("dragover.nrs, drop.nrs");

		$("#nrs_update_drop_zone, #nrs_update_result, #nrs_update_hashes, #nrs_update_hash_progress").hide();

		$(this).find("ul.nav li.active").removeClass("active");
		$("#nrs_modal_state_nav").addClass("active");

		$(".nrs_modal_content").hide();
	});

	$("#nrs_modal ul.nav li").click(function(e) {
		e.preventDefault();

		var tab = $(this).data("tab");

		$(this).siblings().removeClass("active");
		$(this).addClass("active");

		$(".nrs_modal_content").hide();

		var content = $("#nrs_modal_" + tab);

		content.show();
	});

	return NRS;
}(NRS || {}, jQuery));