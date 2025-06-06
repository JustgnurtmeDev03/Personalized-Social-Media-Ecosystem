import React, { useEffect, useState } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useForm } from "react-hook-form";
import { rules } from "../../utils/rules";
import { checkEmailExists, registerUser } from "../../services/authService";

export default function Register({ onClose }) {
  const [successMessage, setSuccessMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const currentYear = new Date().getFullYear();
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from(
    { length: currentYear - 1899 },
    (_, i) => currentYear - i
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm();

  const handleContinueLogin = () => {
    setSuccessMessage("");
    onClose();
  };

  const getDaysInMonth = (month, year) => {
    if (month === 2) {
      const isLeapYear =
        (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
      return isLeapYear ? 29 : 28;
    }
    return [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
  };

  const validateDate = (day, month, year) => {
    if (!day || !month || !year) {
      return "Vui lòng chọn đầy đủ ngày, tháng, năm.";
    }

    const maxDays = getDaysInMonth(month, year);
    if (day > maxDays) {
      if (month === 2 && day === 29) {
        return `Năm ${year} không phải năm nhuận, tháng 2 chỉ có 28 ngày.`;
      }
      return `Tháng ${month} chỉ có ${maxDays} ngày.`;
    }

    const selectedDate = new Date(year, month - 1, day);
    const today = new Date();

    if (selectedDate > today) {
      return "Ngày sinh không thể trong tương lai.";
    }
    let age = today.getFullYear() - selectedDate.getFullYear();
    const m = today.getMonth() - selectedDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < selectedDate.getDate())) {
      age--;
    }
    if (age < 13) {
      return "Bạn phải từ 13 tuổi trở lên.";
    }
    if (age > 120) {
      return "Tuổi không hợp lý.";
    }
    return true;
  };

  // Re-validate specific date issues (age and invalid date) in real-time
  useEffect(() => {
    if (day && month && year) {
      const maxDays = getDaysInMonth(month, year);
      const selectedDate = new Date(year, month - 1, day);
      const today = new Date();
      let age = today.getFullYear() - selectedDate.getFullYear();
      const m = today.getMonth() - selectedDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < selectedDate.getDate())) {
        age--;
      }

      if (day > maxDays) {
        setError("date_of_birth", {
          type: "manual",
          message:
            month === 2 && day === 29
              ? `Năm ${year} không phải năm nhuận, tháng 2 chỉ có 28 ngày.`
              : `Tháng ${month} chỉ có ${maxDays} ngày.`,
        });
      } else if (age < 13) {
        setError("date_of_birth", {
          type: "manual",
          message: "Bạn phải từ 13 tuổi trở lên.",
        });
      } else {
        clearErrors("date_of_birth");
      }
    }
  }, [day, month, year, setError, clearErrors]);

  const onSubmit = async (data) => {
    setSubmitError("");
    setEmailError("");
    const { day, month, year } = data;
    const validationResult = validateDate(day, month, year);
    if (validationResult !== true) {
      setError("date_of_birth", { type: "manual", message: validationResult });
      return;
    }

    setIsCheckingEmail(true);
    try {
      console.log("Checking email:", data.email.trim());
      const emailExists = await checkEmailExists(data.email.trim());
      if (emailExists) {
        setError("email", {
          type: "manual",
          message: "Email này đã được đăng ký. Vui lòng sử dụng email khác.",
        });
        setEmailError(
          "Email này đã được đăng ký. Vui lòng sử dụng email khác."
        );
        return;
      }

      const res = await registerUser({
        name: data.name,
        email: data.email.trim(),
        password: data.password,
        confirm_password: data.confirm_password,
        date_of_birth: `${data.year}-${data.month
          .toString()
          .padStart(2, "0")}-${data.day.toString().padStart(2, "0")}`,
      });

      console.log("Registration successful:", res);
      setSuccessMessage(
        "Đăng ký thành công, hãy kiểm tra đường dẫn được gửi đến Email của bạn để xác thực tài khoản!"
      );
    } catch (err) {
      console.log("Error occurred:", err);
      const errorMessage =
        err.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.";
      if (!emailError) {
        setSubmitError(errorMessage);
      }
    } finally {
      setIsCheckingEmail(false);
    }
  };

  return (
    <section className="bg-gray-50 dark:bg-gray-900">
      <div className="overlay flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
        {successMessage && (
          <div className="success-message-container" role="alert">
            <svg
              className="success-icon"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 6L9 17L4 12"
                stroke="#ffffff"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="success-message">{successMessage}</div>
            <button onClick={handleContinueLogin} className="success-cta-btn">
              Tiếp tục đăng nhập
            </button>
          </div>
        )}
        {!successMessage && (
          <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
            <div className="p-6 space-y-4 md:space-y-6 sm:p-4 sm:pr-8 sm:pl-8">
              <button onClick={onClose} className="close-button-rg">
                <i className="fas fa-times"></i>
              </button>

              <h1 className="text-xl text-center font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
                Tạo một tài khoản
              </h1>
              {emailError && (
                <div className="text-red-600 text-sm text-center" role="alert">
                  {emailError}
                </div>
              )}
              {submitError && (
                <div className="text-red-600 text-sm text-center" role="alert">
                  {submitError}
                </div>
              )}
              <form
                className="space-y-4 md:space-y-2"
                onSubmit={handleSubmit(onSubmit)}
                noValidate
              >
                <div>
                  <input
                    type="text"
                    id="name"
                    placeholder="Tên"
                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    {...register("name", rules.name)}
                  />
                  <div className="mt-1 text-red-600 min-h-[1rem] text-sm">
                    {errors.name?.message}
                  </div>
                </div>
                <div>
                  <input
                    type="email"
                    id="email"
                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    placeholder="Email"
                    {...register("email", rules.email)}
                  />
                  <div className="mt-1 text-red-600 min-h-[1rem] text-sm">
                    {errors.email?.message}
                  </div>
                </div>
                <div>
                  <input
                    type="password"
                    id="password"
                    placeholder="Mật khẩu"
                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    {...register("password", rules.password)}
                  />
                  <div className="mt-1 text-red-600 min-h-[1rem] text-sm">
                    {errors.password?.message}
                  </div>
                </div>
                <div>
                  <input
                    type="password"
                    id="confirm_password"
                    placeholder="Xác nhận mật khẩu"
                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    {...register("confirm_password", rules.confirm_password)}
                  />
                  <div className="mt-1 text-red-600 min-h-[1rem] text-sm">
                    {errors.confirm_password?.message}
                  </div>
                </div>

                <h2 className="text-sm font-bold">Ngày sinh</h2>
                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <label
                        htmlFor="day"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Ngày
                      </label>
                      <select
                        id="day"
                        value={day}
                        {...register("day", rules.day)}
                        onChange={(e) => setDay(Number(e.target.value) || "")}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="">Chọn ngày</option>
                        {days.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                      <div className="mt-1 text-red-600 min-h-[1rem] text-sm">
                        {errors.day?.message}
                      </div>
                    </div>

                    <div className="flex-1">
                      <label
                        htmlFor="month"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Tháng
                      </label>
                      <select
                        id="month"
                        value={month}
                        {...register("month", rules.month)}
                        onChange={(e) => setMonth(Number(e.target.value) || "")}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="">Chọn tháng</option>
                        {months.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                      <div className="mt-1 text-red-600 min-h-[1rem] text-sm">
                        {errors.month?.message}
                      </div>
                    </div>

                    <div className="flex-1">
                      <label
                        htmlFor="year"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Năm
                      </label>
                      <select
                        id="year"
                        value={year}
                        {...register("year", rules.year)}
                        onChange={(e) => setYear(Number(e.target.value) || "")}
                        className="mt-1 block w/full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="">Chọn năm</option>
                        {years.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                      <div className="mt-1 text-red-600 min-h-[1rem] text-sm">
                        {errors.year?.message}
                      </div>
                    </div>
                  </div>
                  {errors.date_of_birth && (
                    <div className="text-red-600 text-sm">
                      {errors.date_of_birth.message}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isCheckingEmail}
                  className={`w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 ${
                    isCheckingEmail ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  Tạo tài khoản
                </button>
                <p className="text-sm font-light text-gray-500 dark:text-gray-400">
                  Bạn đã có tài khoản?{" "}
                  <a
                    onClick={onClose}
                    href="#"
                    className="font-medium text-primary-600 hover:underline dark:text-primary-500"
                  >
                    Đăng nhập ở đây
                  </a>
                </p>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
