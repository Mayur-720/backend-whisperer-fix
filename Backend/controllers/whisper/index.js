
module.exports = {
	...require("./sendWhisper"),
	...require("./getMyWhispers"),
	...require("./getWhisperConversation"),
	...require("./markWhisperAsRead"),
	...require("./deleteConversation"),
	...require("./editWhisperMessage"),
	...require("./deleteWhisperMessage"),
	...require("./saveWhisper"),
};
