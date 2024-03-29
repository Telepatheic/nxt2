package nxt.http;

import nxt.Account;
import nxt.Alias;
import nxt.Asset;
import nxt.Attachment;
import nxt.Block;
import nxt.Nxt;
import nxt.Order;
import nxt.Poll;
import nxt.Token;
import nxt.Trade;
import nxt.Transaction;
import nxt.crypto.Crypto;
import nxt.peer.Hallmark;
import nxt.peer.Peer;
import nxt.util.Convert;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;

import java.util.Collections;

final class JSONData {

    static JSONObject alias(Alias alias) {
        JSONObject json = new JSONObject();
        json.put("account", Convert.toUnsignedLong(alias.getAccount().getId()));
        json.put("alias", alias.getAliasName());
        json.put("uri", alias.getURI());
        json.put("timestamp", alias.getTimestamp());
        return json;
    }

    static JSONObject accountBalance(Account account) {
        JSONObject json = new JSONObject();
        if (account == null) {
            json.put("balanceNQT", "0");
            json.put("unconfirmedBalanceNQT", "0");
            json.put("effectiveBalanceNXT", "0");
        } else {
            synchronized (account) { // to make sure balance and unconfirmedBalance are consistent
                json.put("balanceNQT", String.valueOf(account.getBalanceNQT()));
                json.put("unconfirmedBalanceNQT", String.valueOf(account.getUnconfirmedBalanceNQT()));
                json.put("effectiveBalanceNXT", account.getEffectiveBalanceNXT());
            }
        }
        return json;
    }

    static JSONObject asset(Asset asset) {
        JSONObject json = new JSONObject();
        json.put("account", Convert.toUnsignedLong(asset.getAccountId()));
        json.put("name", asset.getName());
        json.put("description", asset.getDescription());
        json.put("decimals", asset.getDecimals());
        json.put("quantityQNT", String.valueOf(asset.getQuantityQNT()));
        json.put("asset", Convert.toUnsignedLong(asset.getId()));
        json.put("numberOfTrades", Trade.getTrades(asset.getId()).size());
        return json;
    }

    static JSONObject askOrder(Order.Ask order) {
        JSONObject json = order(order);
        json.put("type", "ask");
        return json;
    }

    static JSONObject bidOrder(Order.Bid order) {
        JSONObject json = order(order);
        json.put("type", "bid");
        return json;
    }

    static JSONObject order(Order order) {
        JSONObject json = new JSONObject();
        json.put("order", Convert.toUnsignedLong(order.getId()));
        json.put("asset", Convert.toUnsignedLong(order.getAssetId()));
        json.put("account", Convert.toUnsignedLong(order.getAccount().getId()));
        json.put("quantityQNT", String.valueOf(order.getQuantityQNT()));
        json.put("priceNQT", String.valueOf(order.getPriceNQT()));
        json.put("height", order.getHeight());
        return json;
    }

    static JSONObject block(Block block) {
        JSONObject json = new JSONObject();
        json.put("height", block.getHeight());
        json.put("generator", Convert.toUnsignedLong(block.getGeneratorId()));
        json.put("timestamp", block.getTimestamp());
        json.put("numberOfTransactions", block.getTransactionIds().size());
        json.put("totalAmountNQT", String.valueOf(block.getTotalAmountNQT()));
        json.put("totalFeeNQT", String.valueOf(block.getTotalFeeNQT()));
        json.put("payloadLength", block.getPayloadLength());
        json.put("version", block.getVersion());
        json.put("baseTarget", Convert.toUnsignedLong(block.getBaseTarget()));
        if (block.getPreviousBlockId() != null) {
            json.put("previousBlock", Convert.toUnsignedLong(block.getPreviousBlockId()));
        }
        if (block.getNextBlockId() != null) {
            json.put("nextBlock", Convert.toUnsignedLong(block.getNextBlockId()));
        }
        json.put("payloadHash", Convert.toHexString(block.getPayloadHash()));
        json.put("generationSignature", Convert.toHexString(block.getGenerationSignature()));
        if (block.getVersion() > 1) {
            json.put("previousBlockHash", Convert.toHexString(block.getPreviousBlockHash()));
        }
        json.put("blockSignature", Convert.toHexString(block.getBlockSignature()));
        JSONArray transactions = new JSONArray();
        for (Long transactionId : block.getTransactionIds()) {
            transactions.add(Convert.toUnsignedLong(transactionId));
        }
        json.put("transactions", transactions);
        return json;
    }

    static JSONObject hallmark(Hallmark hallmark) {
        JSONObject json = new JSONObject();
        json.put("account", Convert.toUnsignedLong(Account.getId(hallmark.getPublicKey())));
        json.put("host", hallmark.getHost());
        json.put("weight", hallmark.getWeight());
        String dateString = Hallmark.formatDate(hallmark.getDate());
        json.put("date", dateString);
        json.put("valid", hallmark.isValid());
        return json;
    }

    static JSONObject token(Token token) {
        JSONObject json = new JSONObject();
        json.put("account", Convert.toUnsignedLong(Account.getId(token.getPublicKey())));
        json.put("timestamp", token.getTimestamp());
        json.put("valid", token.isValid());
        return json;
    }

    static JSONObject peer(Peer peer) {
        JSONObject json = new JSONObject();
        json.put("state", peer.getState().ordinal());
        json.put("announcedAddress", peer.getAnnouncedAddress());
        json.put("shareAddress", peer.shareAddress());
        if (peer.getHallmark() != null) {
            json.put("hallmark", peer.getHallmark().getHallmarkString());
        }
        json.put("weight", peer.getWeight());
        json.put("downloadedVolume", peer.getDownloadedVolume());
        json.put("uploadedVolume", peer.getUploadedVolume());
        json.put("application", peer.getApplication());
        json.put("version", peer.getVersion());
        json.put("platform", peer.getPlatform());
        json.put("blacklisted", peer.isBlacklisted());
        return json;
    }

    static JSONObject poll(Poll poll) {
        JSONObject json = new JSONObject();
        json.put("name", poll.getName());
        json.put("description", poll.getDescription());
        JSONArray options = new JSONArray();
        Collections.addAll(options, poll.getOptions());
        json.put("options", options);
        json.put("minNumberOfOptions", poll.getMinNumberOfOptions());
        json.put("maxNumberOfOptions", poll.getMaxNumberOfOptions());
        json.put("optionsAreBinary", poll.isOptionsAreBinary());
        JSONArray voters = new JSONArray();
        for (Long voterId : poll.getVoters().keySet()) {
            voters.add(Convert.toUnsignedLong(voterId));
        }
        json.put("voters", voters);
        return json;
    }

    static JSONObject trade(Trade trade) {
        JSONObject json = new JSONObject();
        json.put("timestamp", trade.getTimestamp());
        json.put("quantityQNT", String.valueOf(trade.getQuantityQNT()));
        json.put("priceNQT", String.valueOf(trade.getPriceNQT()));
        json.put("asset", Convert.toUnsignedLong(trade.getAssetId()));
        json.put("askOrder", Convert.toUnsignedLong(trade.getAskOrderId()));
        json.put("bidOrder", Convert.toUnsignedLong(trade.getBidOrderId()));
        json.put("block", Convert.toUnsignedLong(trade.getBlockId()));
        return json;
    }

    static JSONObject unconfirmedTransaction(Transaction transaction) {
        JSONObject json = new JSONObject();
        json.put("type", transaction.getType().getType());
        json.put("subtype", transaction.getType().getSubtype());
        json.put("timestamp", transaction.getTimestamp());
        json.put("deadline", transaction.getDeadline());
        json.put("senderPublicKey", Convert.toHexString(transaction.getSenderPublicKey()));
        json.put("recipient", Convert.toUnsignedLong(transaction.getRecipientId()));
        json.put("amountNQT", String.valueOf(transaction.getAmountNQT()));
        json.put("feeNQT", String.valueOf(transaction.getFeeNQT()));
        json.put("referencedTransaction", Convert.toUnsignedLong(transaction.getReferencedTransactionId()));
        if (transaction.getReferencedTransactionFullHash() != null) {
            json.put("referencedTransactionFullHash", transaction.getReferencedTransactionFullHash());
        }
        byte[] signature = Convert.emptyToNull(transaction.getSignature());
        if (signature != null) {
            json.put("signature", Convert.toHexString(signature));
            json.put("signatureHash", Convert.toHexString(Crypto.sha256().digest(signature)));
            json.put("fullHash", transaction.getFullHash());
            json.put("transaction", transaction.getStringId());
        }
        if (transaction.getAttachment() != null) {
            json.put("attachment", attachment(transaction.getAttachment()));
        }
        json.put("sender", Convert.toUnsignedLong(transaction.getSenderId()));
        json.put("hash", transaction.getHash());
        return json;
    }

    static JSONObject transaction(Transaction transaction) {
        JSONObject json = unconfirmedTransaction(transaction);
        json.put("block", Convert.toUnsignedLong(transaction.getBlockId()));
        json.put("confirmations", Nxt.getBlockchain().getLastBlock().getHeight() - transaction.getHeight());
        json.put("blockTimestamp", transaction.getBlockTimestamp());
        return json;
    }

    // ugly, hopefully temporary
    static JSONObject attachment(Attachment attachment) {
        JSONObject json = attachment.getJSONObject();
        Long quantityQNT = (Long) json.remove("quantityQNT");
        if (quantityQNT != null) {
            json.put("quantityQNT", String.valueOf(quantityQNT));
        }
        Long priceNQT = (Long) json.remove("priceNQT");
        if (priceNQT != null) {
            json.put("priceNQT", String.valueOf(priceNQT));
        }
        return json;
    }

    private JSONData() {} // never

}
