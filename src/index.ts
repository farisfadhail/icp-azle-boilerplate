// cannister code goes here
import { v4 as uuidv4 } from "uuid";
import { Record, StableBTreeMap, Vec, Result, nat64, ic, Opt, text, Canister, query, Some, None, update } from "azle";

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
	getMessages: query([], Result(Vec(Message), text), () => {
		return Result.Ok(messageStorage.values());
	}),

	getMessage: query([text], Result(Message, text), (id) => {
		const message = messageStorage.get(id);

		// Result.Err("A message with id=" + id + " not found");
		return message !== undefined && message !== null ? Result.Ok(message.values()) : Result.Err("A message with id=" + id + " not found");
	}),

	addMessage: update([MessagePayload], Result(Message, text), (payload) => {
		const message: typeof Message = { id: uuidv4(), createdAt: ic.time(), updatedAt: None, ...payload };
		messageStorage.insert(message.id, message);
		return Result.Ok(message);
	}),

	updateMessage: update([text, MessagePayload], Result(Message, text), (id, payload) => {
		const message = messageStorage.get(id);

		return message !== undefined && message !== null
			? (() => {
					const updateMessage: typeof Message = { ...message, ...payload, updatedAt: Some(ic.time()) };
					messageStorage.insert(message.id, updateMessage);
					return Result.Ok(updateMessage);
			  })()
			: Result.Err(`Couldn't update a message with id=${id}. Message not found`);
	}),

	deleteMessage: update([text], Result(Message, text), (id) => {
		const deletedMessage = messageStorage.remove(id);

		return deletedMessage !== undefined && deletedMessage !== null ? Result.Ok(deletedMessage) : Result.Err(`couldn't delete a message with id=${id}. message not found.`);
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
