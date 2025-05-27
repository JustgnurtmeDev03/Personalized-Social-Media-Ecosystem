export const Loading = () => {
  return (
    <html>
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-white flex flex-col items-center justify-center min-h-screen relative">
        <div class="flex flex-col items-center">
          <img
            src="https://placehold.co/200x200"
            alt="Colorful logo resembling an 'a' character"
            class="w-32 h-32"
          ></img>
        </div>
        <div class="absolute bottom-10 flex flex-col items-center">
          <p class="text-gray-500 text-lg">from</p>
          <div class="flex items-center">
            <img
              src="https://placehold.co/50x50"
              alt="Meta logo"
              class="w-6 h-6"
            ></img>
            <span class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 ml-2">
              Meta
            </span>
          </div>
        </div>
      </body>
    </html>
  );
};
