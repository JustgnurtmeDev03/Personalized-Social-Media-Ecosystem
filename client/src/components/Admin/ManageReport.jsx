import React, { useEffect, useState } from "react";
import api from "../../services/threadService";
import { useAuth } from "../../providers/AuthContext";

// Ánh xạ lý do báo cáo sang tiếng Việt
const reasonMapping = {
  dislike: "Tôi không thích nội dung này",
  bullying: "Bắt nạt hoặc liên lạc không mong muốn",
  self_harm: "Tự tử, tự gây thương tích hoặc rối loạn ăn uống",
  violence: "Bạo lực, thù hận hoặc bóc lột",
  restricted_items: "Bán hoặc quảng bá các mặt hàng bị hạn chế",
  nudity: "Khỏa thân hoặc hoạt động tình dục",
  scam: "Lừa đảo, gian lận hoặc spam",
  false_info: "Thông tin sai lệch",
  intellectual_property: "Vi phạm sở hữu trí tuệ",
};

const ManageReports = () => {
  const { auth } = useAuth();
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const reportsPerPage = 10;

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get("/reports", {
          headers: { Authorization: `Bearer ${auth.accessToken}` },
        });
        setReports(res.data);
        setFilteredReports(res.data);
      } catch (err) {
        setError("Không thể tải danh sách báo cáo");
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [auth.accessToken]);

  useEffect(() => {
    const filtered = reports.filter(
      (report) =>
        report.postId?.content
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        report.postId?.author?.username
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        report.reason?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredReports(filtered);
    setCurrentPage(1);
  }, [searchTerm, reports]);

  const handleIgnore = async (reportId) => {
    if (!window.confirm("Bạn có chắc muốn bỏ qua báo cáo này?")) return;
    try {
      await api.post(
        `/reports/${reportId}/ignore`,
        {},
        { headers: { Authorization: `Bearer ${auth.accessToken}` } }
      );
      setReports((prev) => prev.filter((report) => report._id !== reportId));
    } catch (err) {
      console.error("Lỗi khi bỏ qua báo cáo:", err);
    }
  };

  const handleDeletePost = async (reportId, postId) => {
    if (!window.confirm("Bạn có chắc muốn xóa bài viết này?")) return;
    try {
      const postResponse = await api.get(`/posts/${postId}`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      const post = postResponse.data;

      await api.delete(`/delete/:id`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });

      await api.post(
        "/notifications",
        {
          recipient: post.author._id,
          type: "post_deleted",
          content:
            "Bài viết của bạn đã bị xóa do vi phạm nguyên tắc cộng đồng.",
          relatedPost: postId,
        },
        { headers: { Authorization: `Bearer ${auth.accessToken}` } }
      );

      setReports((prev) => prev.filter((report) => report._id !== reportId));
    } catch (err) {
      console.error("Lỗi khi xóa bài đăng:", err);
    }
  };

  const openModal = (report) => {
    setSelectedReport(report);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedReport(null);
  };

  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = filteredReports.slice(
    indexOfFirstReport,
    indexOfLastReport
  );
  const totalPages = Math.ceil(filteredReports.length / reportsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
      </div>
    );
  if (error)
    return (
      <div className="text-center text-red-500 p-4">
        <p>{error}</p>
      </div>
    );

  return (
    <div className="container mx-auto p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Quản lý báo cáo</h2>

      {/* Tìm kiếm */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Tìm kiếm theo nội dung, tác giả, hoặc lý do..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {filteredReports.length > 0 ? (
        <>
          <div className="overflow-x-auto shadow-lg rounded-lg">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-50 text-gray-700">
                  <th className="py-3 px-4 text-left font-semibold">
                    Nội dung
                  </th>
                  <th className="py-3 px-4 text-left font-semibold">Tác giả</th>
                  <th className="py-3 px-4 text-left font-semibold">Lý do</th>
                  <th className="py-3 px-4 text-left font-semibold">Media</th>
                  <th className="py-3 px-4 text-left font-semibold">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentReports.map((report) => (
                  <tr
                    key={report._id}
                    className="border-t border-gray-200 hover:bg-gray-50"
                  >
                    <td className="py-4 px-4">
                      <p className="text-gray-800">
                        {report.postId?.content?.substring(0, 30) ||
                          "Không có nội dung"}
                        {report.postId?.content?.length > 30 && "..."}
                      </p>
                    </td>
                    <td className="py-4 px-4 flex items-center space-x-2">
                      {report.postId?.author?.avatar ? (
                        <img
                          src={report.postId.author.avatar}
                          alt="Avatar"
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                          {report.postId?.author?.username?.charAt(0) || "?"}
                        </div>
                      )}
                      <p className="text-gray-600">
                        {report.postId?.author?.username || "Không xác định"}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-gray-600">
                        {reasonMapping[report.reason] || report.reason}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      {report.postId?.images?.length > 0 ? (
                        <img
                          src={report.postId.images[0]}
                          alt="Media"
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : report.postId?.videos?.length > 0 ? (
                        <video
                          src={report.postId.videos[0]}
                          className="w-12 h-12 object-cover rounded"
                          controls
                        />
                      ) : (
                        <p className="text-gray-500">Không</p>
                      )}
                    </td>
                    <td className="py-4 px-4 flex space-x-2">
                      <button
                        onClick={() => openModal(report)}
                        className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200"
                        title="Xem chi tiết"
                      >
                        Chi tiết
                      </button>
                      <button
                        onClick={() => handleIgnore(report._id)}
                        className="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition duration-200"
                        title="Bỏ qua báo cáo"
                      >
                        Bỏ qua
                      </button>
                      <button
                        onClick={() =>
                          handleDeletePost(report._id, report.postId?._id)
                        }
                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition duration-200"
                        title="Xóa bài viết"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phân trang */}
          <div className="mt-6 flex justify-center space-x-2">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Trước
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => paginate(i + 1)}
                className={`px-3 py-1 rounded ${
                  currentPage === i + 1
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </>
      ) : (
        <p className="text-gray-600 text-center">
          Không có bài viết bị báo cáo nào.
        </p>
      )}

      {/* Modal chi tiết */}
      {modalOpen && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-gray-800">
              Chi tiết báo cáo
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                {selectedReport.postId?.author?.avatar ? (
                  <img
                    src={selectedReport.postId.author.avatar}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                    {selectedReport.postId?.author?.username?.charAt(0) || "?"}
                  </div>
                )}
                <p>
                  <strong>Tác giả:</strong>{" "}
                  {selectedReport.postId?.author?.username || "Không xác định"}
                </p>
              </div>
              <p>
                <strong>Nội dung:</strong>{" "}
                {selectedReport.postId?.content || "Không có nội dung"}
              </p>
              <p>
                <strong>Thời gian:</strong>{" "}
                {new Date(selectedReport.postId?.createdAt).toLocaleString()}
              </p>
              <p>
                <strong>Lý do:</strong>{" "}
                {reasonMapping[selectedReport.reason] || selectedReport.reason}
              </p>
              <div>
                <h4 className="text-md font-semibold mb-2">Media:</h4>
                {selectedReport.postId?.images?.length > 0 ||
                selectedReport.postId?.videos?.length > 0 ? (
                  <div className="space-y-3">
                    {selectedReport.postId.images.map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`Hình ảnh ${index + 1}`}
                        className="w-full h-auto rounded"
                      />
                    ))}
                    {selectedReport.postId.videos.map((video, index) => (
                      <video
                        key={index}
                        src={video}
                        className="w-full h-auto rounded"
                        controls
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Không có media</p>
                )}
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition duration-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageReports;
