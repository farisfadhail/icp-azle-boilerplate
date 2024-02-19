// cannister code goes here
import { v4 as uuidv4 } from "uuid";
import { Record, StableBTreeMap, Vec, Result, nat64, ic, Opt, text, Canister, query, Some, None, update, Err, Ok } from "azle";

const Message = Record({
	id: text,
	title: text,
	body: text,
	attachmentURL: text,
	createdAt: nat64,
	updatedAt: Opt(nat64),
});

const MessagePayload = Record({
	title: text,
	body: text,
	attachmentURL: text,
});

const messageStorage = StableBTreeMap(text, Message, 0);

export default Canister({
	getMessages: query([], Vec(Message), () => {
		return messageStorage.values();
	}),

	getMessage: query([text], Result(Opt(Message), text), (id) => {
		const message = messageStorage.get(id);

		if ("None" in message) {
			return Err("A message with id='" + id + "' not found");
		}

		return Ok(message);
	}),

	addMessage: update([MessagePayload], Result(Message, text), (payload) => {
		const message: typeof Message = { id: uuidv4(), createdAt: ic.time(), updatedAt: None, ...payload };
		messageStorage.insert(message.id, message);
		return Ok(message);
	}),

	updateMessage: update([text, MessagePayload], Result(Message, text), (id, payload) => {
		const message = messageStorage.get(id);

		if ("None" in message) {
			return Err("A message with id='" + id + "' not found");
		}

		const updatedMessage = { ...message, ...payload, updatedAt: ic.time() };
		messageStorage.insert(message.id, updatedMessage);
		return Ok(updatedMessage);
	}),

	deleteMessage: update([text], Result(Message, text), (id) => {
		const messageOpt = messageStorage.get(id);

		if ("None" in messageOpt) {
			return Err("couldn't delete a message with id='" + id + "'. message not found.");
		}

		const message = messageOpt.Some;

		messageStorage.remove(message.id);

		return Ok(message);
	}),
});

// a workaround to make uuid package work with Azle
globalThis.crypto = {
	// @ts-ignore
	getRandomValues: () => {
		let array = new Uint8Array(32);

		for (let i = 0; i < array.length; i++) {
			array[i] = Math.floor(Math.random() * 256);
		}

		return array;
	},
};
