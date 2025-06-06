// src/components/Admin/ManageUser.jsx

import React, { useState, useEffect, useRef } from "react";
import {
  fetchAllUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../../services/userService";
import Authentication from "./Authentication";

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(null);
  const [newUser, setNewUser] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    roles: ["user"],
    status: "active",
    bio: "",
    avatar: null,
    date_of_birth: { day: "", month: "", year: "" },
  });
  const [editUser, setEditUser] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // ref để xác định click ngoài menu hành động (nếu cần sử dụng sau này)
  const menuRef = useRef(null);
  // ref cho modal Edit User
  const editModalRef = useRef(null);
  // ref cho modal Delete Confirmation
  const deleteModalRef = useRef(null);

  // Fetch danh sách người dùng
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const authToken = localStorage.getItem("accessToken");
        if (!authToken) throw new Error("Không có token để xác thực");

        const usersData = await fetchAllUsers(authToken);
        if (!Array.isArray(usersData.users)) {
          throw new Error(
            "Dữ liệu người dùng không đúng định dạng: 'users' không phải là mảng"
          );
        }
        setUsers(usersData.users);
      } catch (err) {
        setError(`Không thể tải danh sách người dùng: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Click ngoài để đóng modal hoặc menu hành động
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Nếu modal edit đang mở, và click nằm ngoài phần chứa ref editModalRef, đóng modal edit
      if (
        editModalOpen &&
        editModalRef.current &&
        !editModalRef.current.contains(event.target)
      ) {
        setEditModalOpen(null);
        setEditUser(null);
      }
      // Nếu modal delete đang mở, và click nằm ngoài phần chứa ref deleteModalRef, đóng modal delete
      if (
        deleteModalOpen &&
        deleteModalRef.current &&
        !deleteModalRef.current.contains(event.target)
      ) {
        setDeleteModalOpen(null);
      }
      // Nếu menuRef cần dùng để đóng menu hành động, có thể để ở đây
      // Ví dụ:
      // if (menuRef.current && !menuRef.current.contains(event.target)) {
      //   // ... đóng menu hành động nếu bạn có menu dropdown
      // }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editModalOpen, deleteModalOpen]);

  // Thêm người dùng mới
  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);
    try {
      const authToken = localStorage.getItem("accessToken");
      if (!authToken) throw new Error("Không có token để xác thực");

      const { day, month, year } = newUser.date_of_birth;
      if (!day || !month || !year)
        throw new Error("Vui lòng điền đầy đủ ngày sinh");
      const date_of_birth = `${year}-${month.padStart(2, "0")}-${day.padStart(
        2,
        "0"
      )}`;

      // FormData để gửi multipart/form-data
      const formData = new FormData();
      formData.append("name", newUser.name);
      formData.append("username", newUser.username);
      formData.append("email", newUser.email);
      formData.append("password", newUser.password);
      formData.append("roles", newUser.roles[0]);
      formData.append("status", newUser.status);
      formData.append("bio", newUser.bio);
      formData.append("date_of_birth", date_of_birth);
      if (newUser.avatar) {
        formData.append("avatar", newUser.avatar);
      }

      await createUser(formData, authToken);

      const usersData = await fetchAllUsers(authToken);
      if (!Array.isArray(usersData.users)) {
        throw new Error(
          "Dữ liệu người dùng không đúng định dạng: 'users' không phải là mảng"
        );
      }
      setUsers(usersData.users);
      setAddModalOpen(false);
      setNewUser({
        name: "",
        username: "",
        email: "",
        password: "",
        roles: ["user"],
        status: "active",
        bio: "",
        avatar: null,
        date_of_birth: { day: "", month: "", year: "" },
      });
    } catch (error) {
      console.error("Error adding user:", error);
      setError(`Không thể thêm người dùng: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Chỉnh sửa người dùng
  const handleEditUser = async (e, userId) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);
    try {
      const authToken = localStorage.getItem("accessToken");
      if (!authToken) throw new Error("Không có token để xác thực");

      const { day, month, year } = editUser.date_of_birth;
      if (!day || !month || !year)
        throw new Error("Vui lòng điền đầy đủ ngày sinh");
      const date_of_birth = `${year}-${month.padStart(2, "0")}-${day.padStart(
        2,
        "0"
      )}`;

      const formData = new FormData();
      formData.append("name", editUser.name);
      formData.append("username", editUser.username);
      formData.append("email", editUser.email);
      formData.append("roles", editUser.roles[0]);
      formData.append("status", editUser.status);
      formData.append("bio", editUser.bio || "");
      formData.append("date_of_birth", date_of_birth);
      if (editUser.avatar instanceof File) {
        formData.append("avatar", editUser.avatar);
      }

      await updateUser(userId, formData, authToken);

      const usersData = await fetchAllUsers(authToken);
      if (!Array.isArray(usersData.users)) {
        throw new Error(
          "Dữ liệu người dùng không đúng định dạng: 'users' không phải là mảng"
        );
      }
      setUsers(usersData.users);
      setEditModalOpen(null);
      setEditUser(null);
    } catch (error) {
      console.error("Error updating user:", error);
      setError(`Không thể cập nhật người dùng: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Xóa người dùng
  const handleDeleteUser = async (userId) => {
    setIsProcessing(true);
    setError(null);
    try {
      const authToken = localStorage.getItem("accessToken");
      if (!authToken) throw new Error("Không có token để xác thực");

      await deleteUser(userId, authToken);

      const usersData = await fetchAllUsers(authToken);
      if (!Array.isArray(usersData.users)) {
        throw new Error(
          "Dữ liệu người dùng không đúng định dạng: 'users' không phải là mảng"
        );
      }
      setUsers(usersData.users);
      setDeleteModalOpen(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      setError(`Không thể xóa người dùng: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Sắp xếp danh sách người dùng
  const sortedUsers = Array.isArray(users)
    ? [...users].sort((a, b) => {
        let aValue = a[sortBy] || "";
        let bValue = b[sortBy] || "";

        if (sortBy === "name" || sortBy === "email" || sortBy === "username") {
          aValue = a[sortBy].toLowerCase();
          bValue = b[sortBy].toLowerCase();
          if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
          if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
          return 0;
        }

        return 0;
      })
    : [];

  if (loading) return <p>Đang tải danh sách người dùng...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="bg-white font-sans text-gray-700">
      <Authentication />
      <div className="max-w-[1150px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <div className="flex space-x-6 text-sm font-medium">
            <button className="text-black font-bold border-b-2 border-black pb-1">
              Người Dùng
              <span className="ml-1">({users.length})</span>
            </button>
          </div>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            onClick={() => setAddModalOpen(true)}
            disabled={isProcessing}
          >
            Thêm Người Dùng
          </button>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border border-gray-100 rounded-md text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap font-normal w-[80px]">
                  Avatar
                </th>
                <th
                  className="px-4 py-3 whitespace-nowrap font-normal w-[150px] cursor-pointer"
                  onClick={() => {
                    if (sortBy === "name") {
                      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
                    } else {
                      setSortBy("name");
                      setSortOrder("asc");
                    }
                  }}
                >
                  Tên {sortBy === "name" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th
                  className="px-4 py-3 whitespace-nowrap font-normal w-[200px] cursor-pointer"
                  onClick={() => {
                    if (sortBy === "email") {
                      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
                    } else {
                      setSortBy("email");
                      setSortOrder("asc");
                    }
                  }}
                >
                  Email{" "}
                  {sortBy === "email" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th className="px-4 py-3 whitespace-nowrap font-normal w-[100px]">
                  Vai trò
                </th>
                <th className="px-4 py-3 whitespace-nowrap font-normal w-[100px]">
                  Tình trạng
                </th>
                <th className="px-4 py-3 whitespace-nowrap font-normal w-[120px]">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedUsers.map((user) => (
                <tr key={user._id}>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <img
                      src={user.avatar || "default-avatar.png"}
                      alt="Avatar"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  </td>
                  <td
                    className="px-4 py-4 whitespace-nowrap max-w-[150px] truncate"
                    title={`${user.name} (${user.username})`}
                  >
                    {user.name} ({user.username})
                  </td>
                  <td
                    className="px-4 py-4 whitespace-nowrap max-w-[200px] truncate"
                    title={user.email}
                  >
                    {user.email}
                  </td>
                  <td
                    className="px-4 py-4 whitespace-nowrap max-w-[100px] truncate"
                    title={user.roles?.join(", ") || "Người dùng"}
                  >
                    {user.roles?.join(", ") || "Người dùng"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {user.status || "Hoạt động"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div
                      className="relative flex items-center gap-3"
                      ref={menuRef}
                    >
                      <button
                        className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                        onClick={() => {
                          const dob = user.date_of_birth
                            ? new Date(user.date_of_birth)
                            : null;
                          setEditUser({
                            ...user,
                            date_of_birth: dob
                              ? {
                                  day: dob.getDate().toString(),
                                  month: (dob.getMonth() + 1).toString(),
                                  year: dob.getFullYear().toString(),
                                }
                              : { day: "", month: "", year: "" },
                          });
                          setEditModalOpen(user._id);
                        }}
                        disabled={isProcessing}
                      >
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M2 21.047a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1"
                          />
                          <path d="M16.996 2a1.02 1.02 0 0 0-.72.281l-3 3.002L3.268 15.288c-.139.14-.21.338-.25.532l-1 5.003a.974.974 0 0 0 1.156 1.157l5.003-1c.194-.04.392-.112.532-.25l10.005-10.007c.445-.444 2.447-2.446 3.003-3a1.02 1.02 0 0 0 .28-.72c0-1.637-.417-2.807-1.282-3.69C19.844 2.423 18.678 2 16.997 2m.394 2.02c.902.052 1.488.26 1.889.67.41.417.669.997.724 1.882-.547.547-1.35 1.337-2.006 1.994l-2.565-2-564c.658-.657 1.41-1.436 1.958-1.983m-3.395 3.42 2.563 2.564-7.567 7.567-2.564-2.564zm-9.006 9.005 2.564 2.564-.094.094c-.66.132-1.993.411-3.22.657l.656-3.22z" />
                        </svg>
                      </button>
                      <button
                        className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                        onClick={() => setDeleteModalOpen(user._id)}
                        disabled={isProcessing}
                      >
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M7 4V2h10v2h5v2h-2v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6H2V4h5zM6 6v15h12V6H6zm2 2h8v2H8V8zm0 4h8v2H8v-2z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal thêm người dùng */}
        {addModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 w-full max-w-3xl shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Thêm Người Dùng
              </h3>
              <form onSubmit={handleAddUser}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên
                    </label>
                    <input
                      type="text"
                      value={newUser.name}
                      onChange={(e) =>
                        setNewUser({ ...newUser, name: e.target.value })
                      }
                      className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên người dùng
                    </label>
                    <input
                      type="text"
                      value={newUser.username}
                      onChange={(e) =>
                        setNewUser({ ...newUser, username: e.target.value })
                      }
                      className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) =>
                        setNewUser({ ...newUser, email: e.target.value })
                      }
                      className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mật khẩu
                    </label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) =>
                        setNewUser({ ...newUser, password: e.target.value })
                      }
                      className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm"
                      required
                      minLength={8}
                      placeholder="Nhập mật khẩu (tối thiểu 8 ký tự)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vai trò
                    </label>
                    <select
                      value={newUser.roles[0]}
                      onChange={(e) =>
                        setNewUser({ ...newUser, roles: [e.target.value] })
                      }
                      className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm"
                    >
                      <option value="top-admin">Top admin</option>
                      <option value="admin">Admin</option>
                      <option value="moderator">Moderator</option>
                      <option value="user">User</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tình trạng
                    </label>
                    <select
                      value={newUser.status}
                      onChange={(e) =>
                        setNewUser({ ...newUser, status: e.target.value })
                      }
                      className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày sinh
                    </label>
                    <div className="flex space-x-2">
                      <select
                        value={newUser.date_of_birth.day}
                        onChange={(e) =>
                          setNewUser({
                            ...newUser,
                            date_of_birth: {
                              ...newUser.date_of_birth,
                              day: e.target.value,
                            },
                          })
                        }
                        className="block w-1/3 rounded-md border border-gray-300 py-2 px-3 text-sm"
                        required
                      >
                        <option value="">Ngày</option>
                        {Array.from({ length: 31 }, (_, i) => (
                          <option key={i} value={(i + 1).toString()}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                      <select
                        value={newUser.date_of_birth.month}
                        onChange={(e) =>
                          setNewUser({
                            ...newUser,
                            date_of_birth: {
                              ...newUser.date_of_birth,
                              month: e.target.value,
                            },
                          })
                        }
                        className="block w-1/3 rounded-md border border-gray-300 py-2 px-3 text-sm"
                        required
                      >
                        <option value="">Tháng</option>
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i} value={(i + 1).toString()}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                      <select
                        value={newUser.date_of_birth.year}
                        onChange={(e) =>
                          setNewUser({
                            ...newUser,
                            date_of_birth: {
                              ...newUser.date_of_birth,
                              year: e.target.value,
                            },
                          })
                        }
                        className="block w-1/3 rounded-md border border-gray-300 py-2 px-3 text-sm"
                        required
                      >
                        <option value="">Năm</option>
                        {Array.from({ length: 100 }, (_, i) => (
                          <option key={i} value={(2025 - i).toString()}>
                            {2025 - i}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tiểu sử
                  </label>
                  <textarea
                    value={newUser.bio}
                    onChange={(e) =>
                      setNewUser({ ...newUser, bio: e.target.value })
                    }
                    className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm"
                    rows="3"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Avatar
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setNewUser({ ...newUser, avatar: e.target.files[0] })
                    }
                    className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    onClick={() => setAddModalOpen(false)}
                    disabled={isProcessing}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Đang thêm..." : "Thêm"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal chỉnh sửa người dùng */}
        {editModalOpen && editUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
              className="bg-white rounded-lg p-8 w-full max-w-3xl shadow-lg"
              ref={editModalRef}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Chỉnh sửa Người Dùng
              </h3>
              <form onSubmit={(e) => handleEditUser(e, editUser._id)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên
                    </label>
                    <input
                      type="text"
                      value={editUser.name}
                      onChange={(e) =>
                        setEditUser({ ...editUser, name: e.target.value })
                      }
                      className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên người dùng
                    </label>
                    <input
                      type="text"
                      value={editUser.username}
                      onChange={(e) =>
                        setEditUser({ ...editUser, username: e.target.value })
                      }
                      className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editUser.email}
                      onChange={(e) =>
                        setEditUser({ ...editUser, email: e.target.value })
                      }
                      className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vai trò
                    </label>
                    <select
                      value={editUser.roles[0]}
                      onChange={(e) =>
                        setEditUser({ ...editUser, roles: [e.target.value] })
                      }
                      className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm"
                    >
                      <option value="top-admin">Top admin</option>
                      <option value="admin">Admin</option>
                      <option value="moderator">Moderator</option>
                      <option value="user">User</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tình trạng
                    </label>
                    <select
                      value={editUser.status}
                      onChange={(e) =>
                        setEditUser({ ...editUser, status: e.target.value })
                      }
                      className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày sinh
                    </label>
                    <div className="flex space-x-2">
                      <select
                        value={editUser.date_of_birth.day}
                        onChange={(e) =>
                          setEditUser({
                            ...editUser,
                            date_of_birth: {
                              ...editUser.date_of_birth,
                              day: e.target.value,
                            },
                          })
                        }
                        className="block w-1/3 rounded-md border border-gray-300 py-2 px-3 text-sm"
                        required
                      >
                        <option value="">Ngày</option>
                        {Array.from({ length: 31 }, (_, i) => (
                          <option key={i} value={(i + 1).toString()}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                      <select
                        value={editUser.date_of_birth.month}
                        onChange={(e) =>
                          setEditUser({
                            ...editUser,
                            date_of_birth: {
                              ...editUser.date_of_birth,
                              month: e.target.value,
                            },
                          })
                        }
                        className="block w-1/3 rounded-md border border-gray-300 py-2 px-3 text-sm"
                        required
                      >
                        <option value="">Tháng</option>
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i} value={(i + 1).toString()}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                      <select
                        value={editUser.date_of_birth.year}
                        onChange={(e) =>
                          setEditUser({
                            ...editUser,
                            date_of_birth: {
                              ...editUser.date_of_birth,
                              year: e.target.value,
                            },
                          })
                        }
                        className="block w-1/3 rounded-md border border-gray-300 py-2 px-3 text-sm"
                        required
                      >
                        <option value="">Năm</option>
                        {Array.from({ length: 100 }, (_, i) => (
                          <option key={i} value={(2025 - i).toString()}>
                            {2025 - i}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tiểu sử
                  </label>
                  <textarea
                    value={editUser.bio || ""}
                    onChange={(e) =>
                      setEditUser({ ...editUser, bio: e.target.value })
                    }
                    className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm"
                    rows="3"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Avatar
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setEditUser({ ...editUser, avatar: e.target.files[0] })
                    }
                    className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    onClick={() => setEditModalOpen(null)}
                    disabled={isProcessing}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Đang lưu..." : "Lưu"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal xác nhận xóa */}
        {deleteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
              className="bg-white rounded-lg p-6 w-full max-w-lg shadow-lg"
              ref={deleteModalRef}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Xác nhận xóa người dùng
              </h3>
              <p className="text-gray-600 mb-6">
                Bạn có chắc chắn muốn xóa người dùng này? Hành động này không
                thể khôi phục.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  onClick={() => setDeleteModalOpen(null)}
                  disabled={isProcessing}
                >
                  Hủy
                </button>
                <button
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                  onClick={() => handleDeleteUser(deleteModalOpen)}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Đang xóa..." : "Xóa"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageUsers;
