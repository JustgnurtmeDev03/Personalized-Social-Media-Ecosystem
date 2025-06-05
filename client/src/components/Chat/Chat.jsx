import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../providers/AuthContext";
import { useSocket } from "../../providers/socketContext";
import { GiphyFetch } from "@giphy/js-fetch-api";
import { Grid } from "@giphy/react-components";
import {
  sendMessage,
  fetchMessages,
  markMessagesAsRead,
} from "../../services/messageService";
import { format } from "date-fns";
import "../../styles/Chat.css";

const giphy = new GiphyFetch("YOUR_GIPHY_API_KEY");
const API_URL = "http://localhost:5000/api";

const Chat = ({ user, onClose }) => {
  const { auth } = useAuth();
  const socket = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showGiphy, setShowGiphy] = useState(false);
  const [giphyType, setGiphyType] = useState("gifs");
  const [replyingTo, setReplyingTo] = useState(null);
  const [hoveredMessage, setHoveredMessage] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const fetchedMessages = await fetchMessages(user._id, auth.accessToken);
        // Đảm bảo sắp xếp lại theo thời gian
        setMessages(
          fetchedMessages.sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          )
        );
        await markMessagesAsRead(user._id, auth.accessToken);
      } catch (error) {
        console.error("Failed to load messages:", error);
      }
    };
    loadMessages();
  }, [user._id, auth.accessToken]);

  useEffect(() => {
    if (socket) {
      const handleNewMessage = (message) => {
        setMessages((prev) => {
          if (
            !prev.some((msg) => msg._id === message._id) &&
            message.sender._id !== auth.userId
          ) {
            return [...prev, message].sort(
              (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
            );
          }
          return prev;
        });
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      };
      socket.on("newMessage", handleNewMessage);
      return () => socket.off("newMessage", handleNewMessage);
    }
  }, [socket, auth.userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (type, content) => {
    try {
      // Kiểm tra replyTo trước khi gửi
      if (replyingTo && !replyingTo._id) {
        console.error("replyingTo does not have a valid _id:", replyingTo);
        setReplyingTo(null); // Reset nếu không hợp lệ
        return;
      }

      const newMessage = await sendMessage(
        user._id,
        type,
        content,
        auth.accessToken,
        replyingTo?._id
      );
      if (newMessage && newMessage._id) {
        const tempMessage = {
          ...newMessage,
          sender: { _id: auth.userId, username: auth.username || "You" },
          createdAt: newMessage.createdAt || new Date().toISOString(),
          replyTo: replyingTo || null,
        };
        setMessages((prev) => {
          if (!prev.some((msg) => msg._id === tempMessage._id)) {
            return [...prev, tempMessage].sort(
              (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
            );
          }
          return prev;
        });
        setInput("");
        setReplyingTo(null);
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleAddReaction = async (messageId, reaction) => {
    try {
      const res = await fetch(`${API_URL}/messages/reaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify({ messageId, reaction }),
      });
      const updatedMessage = await res.json();
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? updatedMessage : msg))
      );
      setShowEmojiPicker(null);
    } catch (error) {
      console.error("Failed to add reaction:", error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleSendMessage("image", file);
  };

  const formatTime = (date) => {
    return format(new Date(date), "dd/MM/yy, h:mm a");
  };

  const handleEmojiClick = (messageId, e) => {
    e.stopPropagation();
    setShowEmojiPicker(messageId === showEmojiPicker ? null : messageId);
  };

  const handleClickOutside = (e) => {
    if (!e.target.closest(".emoji-picker") && !e.target.closest(".emoji-btn")) {
      setShowEmojiPicker(null);
    }
  };

  const GiphyPicker = () => (
    <Grid
      width={300}
      columns={3}
      fetchGifs={(offset) =>
        giphy.search({ q: input || "funny", type: giphyType, offset })
      }
      onGifClick={(gif) => {
        handleSendMessage(giphyType, gif.images.original.url);
        setShowGiphy(false);
      }}
    />
  );

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleClickOutside}
    >
      <div className="bg-white rounded-lg w-full max-w-lg h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center">
            <img
              src={user.avatar}
              alt=""
              className="w-8 h-8 rounded-full mr-2"
            />
            <div>
              <div className="font-semibold">{user.name}</div>
              <div className="text-sm text-gray-500">Active 2h ago</div>
            </div>
          </div>
          <button onClick={onClose} className="text-xl">
            ×
          </button>
        </div>

        {/* Profile Summary */}
        <div className="p-4 border-b text-center">
          <img
            src={user.avatar}
            alt=""
            className="w-16 h-16 rounded-full mx-auto mb-2"
          />
          <div className="font-semibold">{user.name}</div>
          <div className="text-sm text-gray-500">{user.username}</div>
          <button className="mt-2 px-4 py-1 border rounded-full">
            Xem hồ sơ
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 p-4 overflow-y-auto">
          {messages.map((msg) => (
            <div key={msg._id} className="mb-4">
              {/* Hiển thị tin nhắn gốc nếu có phản hồi */}
              {msg.replyTo && (
                <div
                  className={`flex ${
                    msg.sender._id === auth.userId
                      ? "justify-end"
                      : "justify-start"
                  } mb-1`}
                >
                  {msg.sender._id !== auth.userId && (
                    <div className="w-8 h-8 mr-2" />
                  )}
                  <div className="max-w-[70%]">
                    <div className="bg-gray-100 p-2 rounded-lg text-xs">
                      <div className="font-semibold text-gray-600">
                        {msg.replyTo.sender._id === auth.userId
                          ? "Bạn"
                          : msg.replyTo.sender.username}
                      </div>
                      <div className="truncate">{msg.replyTo.content}</div>
                    </div>
                  </div>
                </div>
              )}
              {/* Tin nhắn hiện tại */}
              <div
                className={`flex items-center ${
                  msg.sender._id === auth.userId
                    ? "justify-end"
                    : "justify-start"
                }`}
                onMouseEnter={() => setHoveredMessage(msg._id)}
                onMouseLeave={() => setHoveredMessage(null)}
              >
                {msg.sender._id !== auth.userId && (
                  <img
                    src={msg.sender.avatar}
                    alt=""
                    className="w-8 h-8 rounded-full mr-2"
                  />
                )}
                <div className="flex flex-col items-end">
                  <div className="flex items-center">
                    {msg.type === "text" ? (
                      <span
                        className={`p-3 rounded-2xl ${
                          msg.sender._id === auth.userId
                            ? "bg-blue-500 text-white"
                            : "bg-white text-gray-800 shadow-sm"
                        }`}
                      >
                        {msg.content}
                      </span>
                    ) : (
                      <img
                        src={msg.content}
                        alt=""
                        className="max-w-full rounded-lg"
                      />
                    )}
                    {hoveredMessage === msg._id && (
                      <div
                        className={`flex space-x-2 ml-2 ${
                          msg.sender._id === auth.userId ? "order-first" : ""
                        }`}
                      >
                        <button
                          onClick={(e) => handleEmojiClick(msg._id, e)}
                          className="emoji-btn text-gray-500 hover:text-blue-500"
                        >
                          😊
                        </button>
                        <button
                          onClick={() => setReplyingTo(msg)}
                          className="text-gray-500 hover:text-blue-500"
                        >
                          <svg
                            className="w-5 h-5 mr-2"
                            aria-label="Reply to message"
                            fill="currentColor"
                            height="16"
                            role="img"
                            viewBox="0 0 24 24"
                            width="16"
                          >
                            <path d="M14 8.999H4.413l5.294-5.292a1 1 0 1 0-1.414-1.414l-7 6.998c-.014.014-.019.033-.032.048A.933.933 0 0 0 1 9.998V10c0 .027.013.05.015.076a.907.907 0 0 0 .282.634l6.996 6.998a1 1 0 0 0 1.414-1.414L4.415 11H14a7.008 7.008 0 0 1 7 7v3.006a1 1 0 0 0 2 0V18a9.01 9.01 0 0 0-9-9Z"></path>
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex justify-center w-full">
                    {formatTime(msg.createdAt)}
                  </div>
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className="text-sm mt-1 flex justify-end items-center space-x-1">
                      {Object.entries(
                        msg.reactions.reduce((acc, r) => {
                          acc[r.reaction] = (acc[r.reaction] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([reaction, count]) => (
                        <span
                          key={reaction}
                          className="bg-gray-100 rounded-full px-2 py-1 flex items-center space-x-1 reaction-container"
                        >
                          <span>{reaction}</span>
                          {count > 1 && <span>{count}</span>}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="absolute bg-white border rounded-lg shadow-lg p-2 z-50 emoji-picker top-[58%] left-[48%] transform -translate-x-1/2 -translate-y-1/2">
            <div className="flex space-x-2">
              {["👍", "❤️", "😂", "😮", "😢", "😡"].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleAddReaction(showEmojiPicker, emoji)}
                  className="text-lg hover:bg-gray-100 p-1 rounded"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t flex flex-col">
          {replyingTo && (
            <div className="bg-gray-100 p-2 rounded-lg mb-2 text-xs flex justify-between items-center">
              <div>
                <div className="font-semibold">
                  Trả lời{" "}
                  {replyingTo.sender._id === auth.userId
                    ? "bạn"
                    : replyingTo.sender.username}
                </div>
                <div className="truncate">{replyingTo.content}</div>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="text-red-500"
              >
                ×
              </button>
            </div>
          )}
          <div className="flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhắn tin..."
              className="flex-1 p-1 border rounded-full mr-2"
              onKeyPress={(e) =>
                e.key === "Enter" && handleSendMessage("text", input)
              }
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="image"
            />
            <label htmlFor="image" className="cursor-pointer mr-2">
              <svg
                aria-label="Add Photo or Video"
                class="x1lliihq x1n2onr6 x5n08af"
                fill="currentColor"
                height="24"
                role="img"
                viewBox="0 0 24 24"
                width="24"
              >
                <title>Add Photo or Video</title>
                <path
                  d="M6.549 5.013A1.557 1.557 0 1 0 8.106 6.57a1.557 1.557 0 0 0-1.557-1.557Z"
                  fill-rule="evenodd"
                ></path>
                <path
                  d="m2 18.605 3.901-3.9a.908.908 0 0 1 1.284 0l2.807 2.806a.908.908 0 0 0 1.283 0l5.534-5.534a.908.908 0 0 1 1.283 0l3.905 3.905"
                  fill="none"
                  stroke="currentColor"
                  stroke-linejoin="round"
                  stroke-width="2"
                ></path>
                <path
                  d="M18.44 2.004A3.56 3.56 0 0 1 22 5.564h0v12.873a3.56 3.56 0 0 1-3.56 3.56H5.568a3.56 3.56 0 0 1-3.56-3.56V5.563a3.56 3.56 0 0 1 3.56-3.56Z"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                ></path>
              </svg>
            </label>
            <button
              onClick={() => {
                setShowGiphy(true);
                setGiphyType("gifs");
              }}
              className="mr-2"
            >
              <svg
                aria-label="Choose a GIF or sticker"
                class="x1lliihq x1n2onr6 x5n08af"
                fill="currentColor"
                height="24"
                role="img"
                viewBox="0 0 24 24"
                width="24"
              >
                <title>Choose a GIF or sticker</title>
                <path
                  d="M13.11 22H7.416A5.417 5.417 0 0 1 2 16.583V7.417A5.417 5.417 0 0 1 7.417 2h9.166A5.417 5.417 0 0 1 22 7.417v5.836a2.083 2.083 0 0 1-.626 1.488l-6.808 6.664A2.083 2.083 0 0 1 13.11 22Z"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                ></path>
                <circle cx="8.238" cy="9.943" r="1.335"></circle>
                <circle cx="15.762" cy="9.943" r="1.335"></circle>
                <path
                  d="M15.174 15.23a4.887 4.887 0 0 1-6.937-.301"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                ></path>
                <path
                  d="M22 10.833v1.629a1.25 1.25 0 0 1-1.25 1.25h-1.79a5.417 5.417 0 0 0-5.417 5.417v1.62a1.25 1.25 0 0 1-1.25 1.25H9.897"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                ></path>
              </svg>
            </button>
            <button
              onClick={() => {
                setShowGiphy(true);
                setGiphyType("stickers");
              }}
            >
              <svg
                aria-label="Choose an emoji"
                class="x1lliihq x1n2onr6 x5n08af"
                fill="currentColor"
                height="24"
                role="img"
                viewBox="0 0 24 24"
                width="24"
              >
                <title>Choose an emoji</title>
                <path d="M15.83 10.997a1.167 1.167 0 1 0 1.167 1.167 1.167 1.167 0 0 0-1.167-1.167Zm-6.5 1.167a1.167 1.167 0 1 0-1.166 1.167 1.167 1.167 0 0 0 1.166-1.167Zm5.163 3.24a3.406 3.406 0 0 1-4.982.007 1 1 0 1 0-1.557 1.256 5.397 5.397 0 0 0 8.09 0 1 1 0 0 0-1.55-1.263ZM12 .503a11.5 11.5 0 1 0 11.5 11.5A11.513 11.513 0 0 0 12 .503Zm0 21a9.5 9.5 0 1 1 9.5-9.5 9.51 9.51 0 0 1-9.5 9.5Z"></path>
              </svg>
            </button>
          </div>
        </div>

        {showGiphy && (
          <div className="absolute bottom-16 left-0 right-0 p-4 bg-white border-t">
            <GiphyPicker />
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
