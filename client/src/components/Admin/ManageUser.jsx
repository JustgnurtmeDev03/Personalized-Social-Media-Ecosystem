import React, { useState, useEffect, useRef } from "react";
import { fetchAllUsers } from "../../services/userService";
import Authentication from "./Authentication";

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(null);
  const [newUser, setNewUser] = useState({
    name: "",
    username: "",
    email: "",
    roles: ["user"],
    status: "active",
    bio: "",
    avatar: "",
    date_of_birth: { day: "", month: "", year: "" },
  });
  const [editUser, setEditUser] = useState(null);
  const menuRef = useRef(null);
  const avatarInputRef = useRef(null);

  // Fetch danh sách người dùng
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const authToken = localStorage.getItem("accessToken");
        if (!authToken) throw new Error("Không có token để xác thực");

        const usersData = await fetchAllUsers({
          headers: { Authorization: `Bearer ${authToken}` },
        });
        setUsers(usersData);
      } catch (err) {
        setError("Không thể tải danh sách người dùng: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Xử lý click ngoài để đóng menu hành động
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setEditModalOpen(null);
        setDeleteModalOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Thêm người dùng mới
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const authToken = localStorage.getItem("accessToken");
      const { day, month, year } = newUser.date_of_birth;
      const date_of_birth = `${year}-${month.toString().padStart(2, "0")}-${day
        .toString()
        .padStart(2, "0")}`;
      const formData = new FormData();
      formData.append("name", newUser.name);
      formData.append("username", newUser.username);
      formData.append("email", newUser.email);
      formData.append("roles", newUser.roles[0]);
      formData.append("status", newUser.status);
      formData.append("bio", newUser.bio);
      formData.append("date_of_birth", date_of_birth);
      if (newUser.avatar) formData.append("avatar", newUser.avatar);

      const response = await fetchAllUsers({
        method: "POST",
        url: "/users",
        headers: { Authorization: `Bearer ${authToken}` },
        data: formData,
      });

      if (response.data) {
        setUsers((prev) => [...prev, response.data.user]);
        setAddModalOpen(false);
        setNewUser({
          name: "",
          username: "",
          email: "",
          roles: ["user"],
          status: "active",
          bio: "",
          avatar: "",
          date_of_birth: { day: "", month: "", year: "" },
        });
      }
    } catch (error) {
      console.error("Error adding user:", error);
      alert("Không thể thêm người dùng");
    }
  };

  // Chỉnh sửa người dùng
  const handleEditUser = async (e, userId) => {
    e.preventDefault();
    try {
      const authToken = localStorage.getItem("accessToken");
      const { day, month, year } = editUser.date_of_birth;
      const date_of_birth = `${year}-${month.toString().padStart(2, "0")}-${day
        .toString()
        .padStart(2, "0")}`;
      const formData = new FormData();
      formData.append("name", editUser.name);
      formData.append("username", editUser.username);
      formData.append("email", editUser.email);
      formData.append("roles", editUser.roles[0]);
      formData.append("status", editUser.status);
      formData.append("bio", editUser.bio);
      formData.append("date_of_birth", date_of_birth);
      if (editUser.avatar) formData.append("avatar", editUser.avatar);

      const response = await fetchAllUsers({
        method: "PUT",
        url: `/users/${userId}`,
        headers: { Authorization: `Bearer ${authToken}` },
        data: formData,
      });

      if (response.data) {
        setUsers((prev) =>
          prev.map((user) => (user._id === userId ? response.data.user : user))
        );
        setEditModalOpen(null);
      }
    } catch (error) {
      console.error("Error editing user:", error);
      alert("Không thể chỉnh sửa người dùng");
    }
  };

  // Xóa người dùng
  const handleDeleteUser = async (userId) => {
    try {
      const authToken = localStorage.getItem("accessToken");
      await fetchAllUsers({
        method: "DELETE",
        url: `/users/${userId}`,
        headers: { Authorization: `Bearer ${authToken}` },
      });

      setUsers((prev) => prev.filter((user) => user._id !== userId));
      setDeleteModalOpen(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Không thể xóa người dùng");
    }
  };

  // Sắp xếp danh sách người dùng
  const sortedUsers = [...users].sort((a, b) => {
    let aValue = a[sortBy] || 0;
    let bValue = b[sortBy] || 0;

    if (sortBy === "createdAt") {
      aValue = new Date(a.createdAt).getTime();
      bValue = new Date(b.createdAt).getTime();
    }

    return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
  });

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
          >
            Thêm Người Dùng
          </button>
        </div>
        <div className="mt-6 overflow-x-auto scrollbar-hide">
          <table className="min-w-full border border-gray-100 rounded-md text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap font-normal w-[80px]">
                  Avatar
                </th>
                <th className="px-4 py-3 whitespace-nowrap font-normal w-[150px]">
                  Tên
                </th>
                <th className="px-4 py-3 whitespace-nowrap font-normal w-[200px]">
                  Email
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
                    title={user.roles?.join(", ")}
                  >
                    {user.roles?.join(", ") || "Người dùng"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {user.status || "Hoạt động"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="relative flex items-center gap-3">
                      <button
                        className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                        onClick={() => {
                          setEditUser({
                            ...user,
                            date_of_birth: user.date_of_birth
                              ? {
                                  day: new Date(user.date_of_birth).getDate(),
                                  month:
                                    new Date(user.date_of_birth).getMonth() + 1,
                                  year: new Date(
                                    user.date_of_birth
                                  ).getFullYear(),
                                }
                              : { day: "", month: "", year: "" },
                          });
                          setEditModalOpen(user._id);
                        }}
                      >
                        <svg
                          className="size-4"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="currentColor"
                        >
                          <path
                            fill-rule="evenodd"
                            clip-rule="evenodd"
                            d="M2 21.047a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1"
                          ></path>
                          <path d="M16.996 2a1.02 1.02 0 0 0-.72.281l-3 3.002L3.268 15.288c-.139.14-.21.338-.25.532l-1 5.003a.974.974 0 0 0 1.156 1.157l5.003-1c.194-.04.392-.112.532-.25l10.005-10.007c.445-.444 2.447-2.446 3.003-3a1.02 1.02 0 0 0 .28-.72c0-1.637-.417-2.807-1.282-3.69C19.844 2.423 18.678 2 16.997 2m.394 2.02c.902.052 1.488.26 1.889.67.41.417.669.997.724 1.882-.547.547-1.35 1.337-2.006 1.994l-2.565-2.564c.658-.657 1.41-1.436 1.958-1.983m-3.395 3.42 2.563 2.564-7.567 7.567-2.564-2.564zm-9.006 9.005 2.564 2.564-.094.094c-.66.132-1.993.411-3.22.657l.656-3.22z"></path>
                        </svg>
                      </button>
                      <button
                        className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                        onClick={() => setDeleteModalOpen(user._id)}
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
                      >
                        <option value="">Ngày</option>
                        {Array.from({ length: 31 }, (_, i) => (
                          <option key={i} value={i + 1}>
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
                      >
                        <option value="">Tháng</option>
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i} value={i + 1}>
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
                      >
                        <option value="">Năm</option>
                        {Array.from({ length: 100 }, (_, i) => (
                          <option key={i} value={2025 - i}>
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
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
                  >
                    Thêm
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal chỉnh sửa người dùng */}
        {editModalOpen && editUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 w-full max-w-3xl shadow-lg">
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
                      >
                        <option value="">Ngày</option>
                        {Array.from({ length: 31 }, (_, i) => (
                          <option key={i} value={i + 1}>
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
                      >
                        <option value="">Tháng</option>
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i} value={i + 1}>
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
                      >
                        <option value="">Năm</option>
                        {Array.from({ length: 100 }, (_, i) => (
                          <option key={i} value={2025 - i}>
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
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
                  >
                    Lưu
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal xác nhận xóa */}
        {deleteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-lg">
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
                >
                  Hủy
                </button>
                <button
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                  onClick={() => handleDeleteUser(deleteModalOpen)}
                >
                  Xóa
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
