import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../providers/AuthContext";
import { useSocket } from "../../providers/socketContext";
import { GiphyFetch } from "@giphy/js-fetch-api";
import { Grid } from "@giphy/react-components";
import {
  sendMessage,
  fetchMessages,
  markMessagesAsRead,
  fetchConversations,
  addReaction,
} from "../../services/messageService";
import { format } from "date-fns";
import "../../styles/Messages.css";
import Sidebar from "../../components/Sidebar/sidebar";
import { useNavigate } from "react-router-dom";

const giphy = new GiphyFetch("YOUR_GIPHY_API_KEY");

const Messages = () => {
  const { auth } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showGiphy, setShowGiphy] = useState(false);
  const [giphyType, setGiphyType] = useState("gifs");
  const [replyingTo, setReplyingTo] = useState(null);
  const [hoveredMessage, setHoveredMessage] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({
    top: 0,
    left: 0,
  });
  const messagesEndRef = useRef(null);
  const messageRefs = useRef({});
  const emojiPickerRef = useRef(null);

  // Tính tổng số tin nhắn chưa đọc
  const totalUnreadMSCount = conversations.reduce(
    (total, conv) => total + conv.unreadCount,
    0
  );

  useEffect(() => {
    const fetchConversationsList = async () => {
      try {
        console.log("Fetching conversations with token:", auth.accessToken); // Debug
        const res = await fetchConversations(auth.accessToken);
        console.log("Conversations fetched:", res);
        setConversations(res);
        if (res.length > 0) {
          setSelectedUser(res[0].user);
        }
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
      }
    };
    fetchConversationsList();
  }, [auth.accessToken]);

  useEffect(() => {
    if (selectedUser) {
      const loadMessages = async () => {
        try {
          console.log(
            "Fetching messages for user:",
            selectedUser._id,
            "with token:",
            auth.accessToken
          ); // Debug
          const fetchedMessages = await fetchMessages(
            selectedUser._id,
            auth.accessToken
          );
          console.log("Messages fetched:", fetchedMessages); // Debug
          setMessages(
            fetchedMessages.sort(
              (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
            )
          );
          await markMessagesAsRead(selectedUser._id, auth.accessToken);
        } catch (error) {
          console.error("Failed to load messages:", error);
          setMessages([]); // Reset messages nếu lỗi
        }
      };
      loadMessages();
    }
  }, [selectedUser, auth.accessToken]);

  useEffect(() => {
    if (socket && selectedUser) {
      const handleNewMessage = (message) => {
        if (
          message.sender._id === selectedUser._id ||
          message.recipientId === selectedUser._id
        ) {
          setMessages((prev) => {
            if (!prev.some((msg) => msg._id === message._id)) {
              return [...prev, message].sort(
                (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
              );
            }
            return prev;
          });
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        } else {
          // Cập nhật unreadCount cho các hội thoại khác
          setConversations((prev) =>
            prev.map((conv) =>
              conv.user._id === message.sender._id
                ? { ...conv, unreadCount: conv.unreadCount + 1 }
                : conv
            )
          );
        }
      };
      socket.on("newMessage", handleNewMessage);
      return () => socket.off("newMessage", handleNewMessage);
    }
  }, [socket, selectedUser, auth.userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (type, content) => {
    try {
      if (replyingTo && !replyingTo._id) {
        console.error("replyingTo does not have a valid _id:", replyingTo);
        setReplyingTo(null);
        return;
      }

      const newMessage = await sendMessage(
        selectedUser._id,
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
      const updatedMessage = await addReaction(
        messageId,
        reaction,
        auth.accessToken
      );
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
    if (messageId !== showEmojiPicker) {
      const messageElement = messageRefs.current[messageId];
      if (messageElement) {
        const message = messages.find((msg) => msg._id === messageId);
        const isRightSide = message.sender._id === auth.userId; // Tin nhắn bên phải
        const rect = messageElement.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const chatArea = document.querySelector(".chat-area");
        const chatAreaRect = chatArea.getBoundingClientRect();

        // Đo kích thước thực tế của emoji-picker
        const pickerElement = emojiPickerRef.current;
        const pickerWidth = pickerElement ? pickerElement.offsetWidth : 200;
        const pickerHeight = pickerElement ? pickerElement.offsetHeight : 50;

        // Tính toán vị trí left dựa trên tin nhắn bên trái hay bên phải
        let left;
        if (isRightSide) {
          // Tin nhắn bên phải: căn emoji-picker bên trái tin nhắn
          left = rect.right - pickerWidth;
          if (left < chatAreaRect.left) {
            left = rect.left;
          }
          if (left + pickerWidth > chatAreaRect.right) {
            left = chatAreaRect.right - pickerWidth - 10;
          }
        } else {
          // Tin nhắn bên trái: căn emoji-picker bên phải tin nhắn
          left = rect.left;
          if (left + pickerWidth > chatAreaRect.right) {
            left = rect.right - pickerWidth;
          }
          if (left < chatAreaRect.left) {
            left = chatAreaRect.left + 10;
          }
        }

        // Tính toán vị trí top ưu tiên gần tin nhắn
        let top = rect.top + window.scrollY + rect.height + 5; // Hiển thị dưới tin nhắn
        if (top + pickerHeight > windowHeight + window.scrollY) {
          // Nếu không đủ không gian dưới, hiển thị phía trên
          top = rect.top + window.scrollY - pickerHeight - 5;
        }

        setEmojiPickerPosition({ top, left });
      }
    }
  };

  const handleClickOutside = (e) => {
    if (!e.target.closest(".emoji-picker") && !e.target.closest(".emoji-btn")) {
      setShowEmojiPicker(null);
    }
  };

  const handleAvatarClick = (userId) => {
    navigate(`/profile/${userId}`);
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

  const handleSelectConversation = async (user) => {
    setSelectedUser(user);
    // Cập nhật ngay lập tức unreadCount về 0 khi click
    setConversations((prev) =>
      prev.map((conv) =>
        conv.user._id === user._id ? { ...conv, unreadCount: 0 } : conv
      )
    );
    try {
      await markMessagesAsRead(user._id, auth.accessToken);
    } catch (error) {
      console.error("Failed to mark messages as read:", error);
    }
  };

  return (
    <div
      className="messages-container flex h-screen"
      onClick={handleClickOutside}
    >
      <Sidebar unreadMSCount={totalUnreadMSCount} />
      <div className="conversations-list w-1/3 border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">
            {auth.username ? auth.username.replace(/^@/, "") : "Bạn"}
          </h2>
        </div>
        {conversations.length === 0 ? (
          <div className="text-gray-500 text-center p-4">
            Chưa có hội thoại nào. Hãy bắt đầu trò chuyện!
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.user._id}
              className={`flex items-center p-4 cursor-pointer hover:bg-gray-100 ${
                selectedUser?._id === conv.user._id ? "bg-gray-100" : ""
              }`}
              onClick={() => handleSelectConversation(conv.user)}
            >
              <img
                src={conv.user.avatar}
                alt=""
                className="w-10 h-10 rounded-full mr-3"
              />
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <div className="font-semibold">{conv.user.name}</div>
                  <div className="text-xs text-gray-500">
                    {formatTime(conv.lastMessage.createdAt)}
                  </div>
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {conv.lastMessage.content}
                </div>
              </div>
              {conv.unreadCount > 0 && (
                <span className="w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                  {conv.unreadCount}
                </span>
              )}
            </div>
          ))
        )}
      </div>

      <div className="chat-area w-2/3 flex flex-col">
        {selectedUser ? (
          <>
            <div className="p-4 border-b flex items-center">
              <img
                src={selectedUser.avatar}
                alt=""
                className="w-8 h-8 rounded-full mr-2 cursor-pointer"
                onClick={() => handleAvatarClick(selectedUser._id)}
              />
              <div className="font-semibold">{selectedUser.name}</div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-gray-500 text-center">
                  Chưa có tin nhắn nào. Hãy bắt đầu trò chuyện!
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg._id}
                    className="mb-4"
                    ref={(el) => (messageRefs.current[msg._id] = el)}
                  >
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
                                ? auth.username.replace(/^@/, "")
                                : msg.replyTo.sender.username}
                            </div>
                            <div className="truncate">
                              {msg.replyTo.content}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
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
                          className="w-8 h-8 rounded-full mr-2 cursor-pointer"
                          onClick={() => handleAvatarClick(msg.sender._id)}
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
                                msg.sender._id === auth.userId
                                  ? "order-first"
                                  : ""
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
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t flex flex-col">
              {replyingTo && (
                <div className="bg-gray-100 p-2 rounded-lg mb-2 text-xs flex justify-between items-center">
                  <div>
                    <div className="font-semibold">
                      Trả lời{" "}
                      {replyingTo.sender._id === auth.userId
                        ? auth.username.replace(/^@/, "")
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
                    className="x1lliihq x1n2onr6 x5n08af"
                    fill="currentColor"
                    height="24"
                    role="img"
                    viewBox="0 0 24 24"
                    width="24"
                  >
                    <title>Add Photo or Video</title>
                    <path
                      d="M6.549 5.013A1.557 1.557 0 1 0 8.106 6.57a1.557 1.557 0 0 0-1.557-1.557Z"
                      fillRule="evenodd"
                    />
                    <path
                      d="m2 18.605 3.901-3.9a.908.908 0 0 1 1.284 0l2.807 2.806a.908.908 0 0 0 1.283 0l5.534-5.534a.908.908 0 0 1 1.283 0l3.905 3.905"
                      fill="none"
                      stroke="currentColor"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                    <path
                      d="M18.44 2.004A3.56 3.56 0 0 1 22 5.564h0v12.873a3.56 3.56 0 0 1-3.56 3.56H5.568a3.56 3.56 0 0 1-3.56-3.56V5.563a3.56 3.56 0 0 1 3.56-3.56Z"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
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
                    className="x1lliihq x1n2onr6 x5n08af"
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
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                    <circle cx="8.238" cy="9.943" r="1.335" />
                    <circle cx="15.762" cy="9.943" r="1.335" />
                    <path
                      d="M15.174 15.23a4.887 4.887 0 0 1-6.937-.301"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                    <path
                      d="M22 10.833v1.629a1.25 1.25 0 0 1-1.25 1.25h-1.79a5.417 5.417 0 0 0-5.417 5.417v1.62a1.25 1.25 0 0 1-1.25 1.25H9.897"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
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
                    className="x1lliihq x1n2onr6 x5n08af"
                    fill="currentColor"
                    height="24"
                    role="img"
                    viewBox="0 0 24 24"
                    width="24"
                  >
                    <title>Choose an emoji</title>
                    <path d="M15.83 10.997a1.167 1.167 0 1 0 1.167 1.167 1.167 1.167 0 0 0-1.167-1.167Zm-6.5 1.167a1.167 1.167 0 1 0-1.166 1.167 1.167 1.167 0 0 0 1.166-1.167Zm5.163 3.24a3.406 3.406 0 0 1-4.982.007 1 1 0 1 0-1.557 1.256 5.397 5.397 0 0 0 8.09 0 1 1 0 0 0-1.55-1.263ZM12 .503a11.5 11.5 0 1 0 11.5 11.5A11.513 11.513 0 0 0 12 .503Zm0 21a9.5 9.5 0 1 1 9.5-9.5 9.51 9.51 0 0 1-9.5 9.5Z" />
                  </svg>
                </button>
              </div>
            </div>

            {showGiphy && (
              <div className="absolute bottom-16 left-0 right-0 p-4 bg-white border-t">
                <GiphyPicker />
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Chọn một người để bắt đầu trò chuyện
          </div>
        )}
      </div>

      {showEmojiPicker && (
        <div
          className="absolute bg-white border rounded-lg shadow-lg p-2 z-50 emoji-picker"
          style={{
            top: `${emojiPickerPosition.top}px`,
            left: `${emojiPickerPosition.left}px`,
          }}
          ref={emojiPickerRef}
        >
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
    </div>
  );
};

export default Messages;
