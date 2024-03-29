var NRS = (function(NRS, $, undefined) {
	NRS.lastTransactionsTimestamp = 0;
	NRS.lastTransactions = "";

	NRS.unconfirmedTransactions = [];
	NRS.unconfirmedTransactionIds = "";
	NRS.unconfirmedTransactionsChange = true;

	NRS.transactionsPageType = null;

	NRS.handleInitialTransactions = function(transactions, transactionIds) {
		if (transactions.length) {
			var rows = "";

			transactions.sort(NRS.sortArray);

			if (transactions.length >= 1) {
				NRS.lastTransactions = transactionIds.toString();

				for (var i = transactions.length - 1; i >= 0; i--) {
					if (transactions[i].confirmed) {
						NRS.lastTransactionsTimestamp = transactions[i].timestamp;
						break;
					}
				}
			}

			for (var i = 0; i < transactions.length; i++) {
				var transaction = transactions[i];

				var receiving = transaction.recipient == NRS.account;
				var account = (receiving ? String(transaction.sender).escapeHTML() : String(transaction.recipient).escapeHTML());

				if (transaction.amountNQT) {
					transaction.amount = new BigInteger(transaction.amountNQT);
					transaction.fee = new BigInteger(transaction.feeNQT);
				}

				//todo: !receiving && transaction.amount NQT

				//todo transactionIds!!

				rows += "<tr class='" + (!transaction.confirmed ? "tentative" : "confirmed") + "'><td><a href='#' data-transaction='" + String(transaction.id).escapeHTML() + "'>" + NRS.formatTimestamp(transaction.timestamp) + "</a></td><td style='width:5px;padding-right:0;'>" + (transaction.type == 0 ? (receiving ? "<i class='fa fa-plus-circle' style='color:#65C62E'></i>" : "<i class='fa fa-minus-circle' style='color:#E04434'></i>") : "") + "</td><td><span" + (transaction.type == 0 && receiving ? " style='color:#006400'" : (!receiving && transaction.amount > 0 ? " style='color:red'" : "")) + ">" + NRS.formatAmount(transaction.amount) + "</span> <span" + ((!receiving && transaction.type == 0) ? " style='color:red'" : "") + ">+</span> <span" + (!receiving ? " style='color:red'" : "") + ">" + NRS.formatAmount(transaction.fee) + "</span></td><td>" + (account != NRS.genesis ? "<a href='#' data-user='" + account + "' class='user_info'>" + NRS.getAccountTitle(account) + "</a>" : "Genesis") + "</td><td class='confirmations' data-confirmations='" + String(transaction.confirmations).escapeHTML() + "' data-initial='true'>" + (transaction.confirmations > 10 ? "10+" : String(transaction.confirmations).escapeHTML()) + "</td></tr>";
			}

			$("#dashboard_transactions_table tbody").empty().append(rows);
		}

		NRS.dataLoadFinished($("#dashboard_transactions_table"));
	}

	NRS.getNewTransactions = function() {
		NRS.sendRequest("getAccountTransactionIds", {
			"account": NRS.account,
			"timestamp": NRS.lastTransactionsTimestamp
		}, function(response) {
			if (response.transactionIds && response.transactionIds.length) {
				var transactionIds = response.transactionIds.reverse().slice(0, 10);

				if (transactionIds.toString() == NRS.lastTransactions) {
					NRS.getUnconfirmedTransactions(function(unconfirmedTransactions) {
						NRS.handleIncomingTransactions(unconfirmedTransactions);
					});
					return;
				}

				NRS.transactionIds = transactionIds;

				var nrTransactions = 0;

				var newTransactions = [];

				//if we have a new transaction, we just get them all.. (10 max)
				for (var i = 0; i < transactionIds.length; i++) {
					NRS.sendRequest('getTransaction', {
						"transaction": transactionIds[i]
					}, function(transaction, input) {
						nrTransactions++;

						transaction.id = input.transaction;
						transaction.confirmed = true;
						newTransactions.push(transaction);

						if (nrTransactions == transactionIds.length) {
							NRS.getUnconfirmedTransactions(function(unconfirmedTransactions) {
								NRS.handleIncomingTransactions(newTransactions.concat(unconfirmedTransactions), transactionIds);
							});
						}
					});
				}
			} else {
				NRS.getUnconfirmedTransactions(function(unconfirmedTransactions) {
					NRS.handleIncomingTransactions(unconfirmedTransactions);
				});
			}
		});
	}

	NRS.getUnconfirmedTransactions = function(callback) {
		NRS.sendRequest("getUnconfirmedTransactionIds", {
			"account": NRS.account
		}, function(response) {
			if (response.unconfirmedTransactionIds && response.unconfirmedTransactionIds.length) {
				var unconfirmedTransactionIds = response.unconfirmedTransactionIds.reverse();

				var nr_transactions = 0;

				var unconfirmedTransactions = [];
				var unconfirmedTransactionIdArray = [];

				for (var i = 0; i < unconfirmedTransactionIds.length; i++) {
					NRS.sendRequest('getTransaction', {
						"transaction": unconfirmedTransactionIds[i]
					}, function(transaction, input) {
						nr_transactions++;

						//leave this for now, for older versions that do not yet have the account param added to getUnconfirmedTransactionIds
						if (transaction.sender == NRS.account) {
							transaction.id = input.transaction;
							transaction.confirmed = false;
							transaction.confirmations = "/";
							unconfirmedTransactions.push(transaction);
							unconfirmedTransactionIdArray.push(transaction.id);
						}

						if (nr_transactions == unconfirmedTransactionIds.length) {
							NRS.unconfirmedTransactions = unconfirmedTransactions;

							var unconfirmedTransactionIdString = unconfirmedTransactionIdArray.toString();

							if (unconfirmedTransactionIdString != NRS.unconfirmedTransactionIds) {
								NRS.unconfirmedTransactionsChange = true;
								NRS.unconfirmedTransactionIds = unconfirmedTransactionIdString;
							} else {
								NRS.unconfirmedTransactionsChange = false;
							}

							if (callback) {
								callback(unconfirmedTransactions);
							} else if (NRS.unconfirmedTransactionsChange) {
								NRS.incoming.updateDashboardTransactions(unconfirmedTransactions, true);
							}
						}
					});
				}
			} else {
				NRS.unconfirmedTransactions = [];

				if (NRS.unconfirmedTransactionIds) {
					NRS.unconfirmedTransactionsChange = true;
				} else {
					NRS.unconfirmedTransactionsChange = false;
				}

				NRS.unconfirmedTransactionIds = "";

				if (callback) {
					callback([]);
				} else if (NRS.unconfirmedTransactionsChange) {
					NRS.incoming.updateDashboardTransactions([], true);
				}
			}
		});
	}

	NRS.handleIncomingTransactions = function(transactions, confirmedTransactionIds) {
		var oldBlock = (confirmedTransactionIds === false); //we pass false instead of an [] in case there is no new block..

		if (typeof confirmedTransactionIds != "object") {
			confirmedTransactionIds = [];
		}

		if (confirmedTransactionIds.length) {
			NRS.lastTransactions = confirmedTransactionIds.toString();

			for (var i = transactions.length - 1; i >= 0; i--) {
				if (transactions[i].confirmed) {
					NRS.lastTransactionsTimestamp = transactions[i].timestamp;
					break;
				}
			}
		}

		if (confirmedTransactionIds.length || NRS.unconfirmedTransactionsChange) {
			transactions.sort(NRS.sortArray);

			NRS.incoming.updateDashboardTransactions(transactions, confirmedTransactionIds.length == 0);
		}

		if (!oldBlock || NRS.unconfirmedTransactionsChange) {
			if (NRS.incoming[NRS.currentPage]) {
				NRS.incoming[NRS.currentPage](transactions);
			}
		}
	}

	NRS.sortArray = function(a, b) {
		return b.timestamp - a.timestamp;
	}

	NRS.incoming.updateDashboardTransactions = function(newTransactions, unconfirmed) {
		var newTransactionCount = newTransactions.length;

		if (newTransactionCount) {
			var rows = "";

			var onlyUnconfirmed = true;

			for (var i = 0; i < newTransactionCount; i++) {
				var transaction = newTransactions[i];

				var receiving = transaction.recipient == NRS.account;
				var account = (receiving ? String(transaction.sender).escapeHTML() : String(transaction.recipient).escapeHTML());

				if (transaction.confirmed) {
					onlyUnconfirmed = false;
				}

				if (transaction.amountNQT) {
					transaction.amount = new BigInteger(transaction.amountNQT);
					transaction.fee = new BigInteger(transaction.feeNQT);
				}

				rows += "<tr class='" + (!transaction.confirmed ? "tentative" : "confirmed") + "'><td>" + (transaction.attachment ? "<a href='#' data-transaction='" + String(transaction.id).escapeHTML() + "' style='font-weight:bold'>" + NRS.formatTimestamp(transaction.timestamp) + "</a>" : NRS.formatTimestamp(transaction.timestamp)) + "</td><td style='width:5px;padding-right:0;'>" + (transaction.type == 0 ? (receiving ? "<i class='fa fa-plus-circle' style='color:#65C62E'></i>" : "<i class='fa fa-minus-circle' style='color:#E04434'></i>") : "") + "</td><td><span" + (transaction.type == 0 && receiving ? " style='color:#006400'" : (!receiving && transaction.amount > 0 ? " style='color:red'" : "")) + ">" + NRS.formatAmount(transaction.amount) + "</span> <span" + ((!receiving && transaction.type == 0) ? " style='color:red'" : "") + ">+</span> <span" + (!receiving ? " style='color:red'" : "") + ">" + NRS.formatAmount(transaction.fee) + "</span></td><td>" + (account != NRS.genesis ? "<a href='#' data-user='" + account + "' class='user_info'>" + NRS.getAccountTitle(account) + "</a>" : "Genesis") + "</td><td class='confirmations' data-confirmations='" + String(transaction.confirmations).escapeHTML() + "' data-initial='true'>" + (transaction.confirmations > 10 ? "10+" : String(transaction.confirmations).escapeHTML()) + "</td></tr>";
			}

			if (onlyUnconfirmed) {
				$("#dashboard_transactions_table tbody tr.tentative").remove();
				$("#dashboard_transactions_table tbody").prepend(rows);
			} else {
				$("#dashboard_transactions_table tbody").empty().append(rows);
			}

			var $parent = $("#dashboard_transactions_table").parent();

			if ($parent.hasClass("data-empty")) {
				$parent.removeClass("data-empty");
				if ($parent.data("no-padding")) {
					$parent.parent().addClass("no-padding");
				}
			}
		} else if (unconfirmed) {
			$("#dashboard_transactions_table tbody tr.tentative").remove();
		}
	}

	//todo: add to dashboard? 
	NRS.addUnconfirmedTransaction = function(transactionId) {
		NRS.sendRequest("getTransaction", {
			"transaction": transactionId
		}, function(response) {
			if (!response.errorCode) {
				response.id = transactionId;
				response.confirmations = "/";
				response.confirmed = false;
				NRS.unconfirmedTransactions.push(response);
				NRS.getAccountInfo();
			}
		});
	}

	NRS.pages.transactions = function() {
		NRS.pageLoading();

		var params = {
			"account": NRS.account,
			"timestamp": 0
		};

		if (NRS.transactionsPageType) {
			params.type = NRS.transactionsPageType.type;
			params.subtype = NRS.transactionsPageType.subtype;
		}

		var rows = "";

		if (NRS.unconfirmedTransactions.length) {
			for (var j = 0; j < NRS.unconfirmedTransactions.length; j++) {
				var unconfirmedTransaction = NRS.unconfirmedTransactions[j];

				if (NRS.transactionsPageType) {
					if (unconfirmedTransaction.type != params.type || unconfirmedTransaction.subtype != params.subtype) {
						continue;
					}
				}

				rows += NRS.getTransactionRowHTML(unconfirmedTransaction);
			}
		}

		NRS.sendRequest("getAccountTransactionIds+", params, function(response) {
			if (response.transactionIds && response.transactionIds.length) {
				var transactions = {};
				var nr_transactions = 0;

				var transactionIds = response.transactionIds.reverse().slice(0, 100);

				for (var i = 0; i < transactionIds.length; i++) {
					NRS.sendRequest("getTransaction+", {
						"transaction": transactionIds[i]
					}, function(transaction, input) {
						if (NRS.currentPage != "transactions") {
							transactions = {};
							return;
						}

						transaction.id = input.transaction;
						transaction.confirmed = true;

						transactions[input.transaction] = transaction;
						nr_transactions++;

						if (nr_transactions == transactionIds.length) {
							for (var i = 0; i < nr_transactions; i++) {
								var transaction = transactions[transactionIds[i]];

								rows += NRS.getTransactionRowHTML(transaction);

							}

							$("#transactions_table tbody").empty().append(rows);
							NRS.dataLoadFinished($("#transactions_table"));

							NRS.pageLoaded();
						}
					});

					if (NRS.currentPage != "transactions") {
						transactions = {};
						return;
					}
				}
			} else {

				$("#transactions_table tbody").empty().append(rows);
				NRS.dataLoadFinished($("#transactions_table"));

				NRS.pageLoaded();
			}
		});
	}

	NRS.incoming.transactions = function(transactions) {
		NRS.pages.transactions();
	}

	NRS.getTransactionRowHTML = function(transaction) {
		var transactionType = "Unknown";

		if (transaction.type == 0) {
			transactionType = "Ordinary payment";
		} else if (transaction.type == 1) {
			switch (transaction.subtype) {
				case 0:
					transactionType = "Arbitrary message";
					break;
				case 1:
					transactionType = "Alias assignment";
					break;
				case 2:
					transactionType = "Poll creation";
					break;
				case 3:
					transactionType = "Vote casting";
					break;
				case 4:
					transactionType = "Hub Announcement";
					break;
				case 5:
					transactionType = "Account Info";
					break;
			}
		} else if (transaction.type == 2) {
			switch (transaction.subtype) {
				case 0:
					transactionType = "Asset issuance";
					break;
				case 1:
					transactionType = "Asset transfer";
					break;
				case 2:
					transactionType = "Ask order placement";
					break;
				case 3:
					transactionType = "Bid order placement";
					break;
				case 4:
					transactionType = "Ask order cancellation";
					break;
				case 5:
					transactionType = "Bid order cancellation";
					break;
			}
		} else if (transaction.type == 3) {
			switch (transaction.subtype) {
				case 0:
					transactionType = "Digital Goods Listing";
					break;
				case 1:
					transactionType = "Digital Goods Delisting";
					break;
				case 2:
					transactionType = "Digtal Goods Price Change";
					break;
				case 3:
					transactionType = "Digital Goods Quantity Change";
					break;
				case 4:
					transactionType = "Digital Goods Purchase";
					break;
				case 5:
					transactionType = "Digital Goods Delivery";
					break;
				case 6:
					transactionType = "Digital Goods Feedback";
					break;
				case 7:
					transactionType = "Digital Goods Refund";
					break;
			}
		} else if (transaction.type == 4) {
			switch (transaction.subtype) {
				case 0:
					transactionType = "Effective Balance Leasing";
					break;
			}
		}

		var receiving = transaction.recipient == NRS.account;
		var account = (receiving ? String(transaction.sender).escapeHTML() : String(transaction.recipient).escapeHTML());

		if (transaction.amountNQT) {
			transaction.amount = new BigInteger(transaction.amountNQT);
			transaction.fee = new BigInteger(transaction.feeNQT);
		}

		return "<tr " + (!transaction.confirmed ? " class='tentative'" : "") + "><td><a href='#' data-transaction='" + String(transaction.id).escapeHTML() + "'>" + String(transaction.id).escapeHTML() + "</a></td><td>" + NRS.formatTimestamp(transaction.timestamp) + "</td><td>" + transactionType + "</td><td style='width:5px;padding-right:0;'>" + (transaction.type == 0 ? (receiving ? "<i class='fa fa-plus-circle' style='color:#65C62E'></i>" : "<i class='fa fa-minus-circle' style='color:#E04434'></i>") : "") + "</td><td " + (transaction.type == 0 && receiving ? " style='color:#006400;'" : (!receiving && transaction.amount > 0 ? " style='color:red'" : "")) + ">" + NRS.formatAmount(transaction.amount) + "</td><td " + (!receiving ? " style='color:red'" : "") + ">" + NRS.formatAmount(transaction.fee) + "</td><td>" + (account != NRS.genesis ? "<a href='#' data-user='" + account + "' class='user_info'>" + NRS.getAccountTitle(account) + "</a>" : "Genesis") + "</td><td>" + (!transaction.confirmed ? "/" : (transaction.confirmations > 1440 ? "1440+" : NRS.formatAmount(transaction.confirmations))) + "</td></tr>";
	}

	$("#transactions_page_type li a").click(function(e) {
		e.preventDefault();

		var type = $(this).data("type");

		if (type) {
			type = type.split(":");
			NRS.transactionsPageType = {
				"type": type[0],
				"subtype": type[1]
			};
		} else {
			NRS.transactionsPageType = null;
		}

		$(this).parents(".btn-group").find(".text").text($(this).text());

		NRS.pages.transactions();
	});

	return NRS;
}(NRS || {}, jQuery));