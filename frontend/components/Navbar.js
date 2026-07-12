const Navbar = {
  template: `
    <nav class="navbar navbar-light" style="background-color: #e3f2fd;">
      <div class="container-fluid d-flex justify-content-between align-items-center">
        <span class="navbar-brand fw-bold text-primary m-0">Placement Portal</span>
        <div>
          <button v-if="isLoggedIn" @click="logout" class="btn btn-outline-danger btn-sm px-3 fw-semibold">Logout</button>
          <a v-else href="#/login" class="btn btn-primary btn-sm px-3 fw-semibold">Login</a>
        </div>
      </div>
    </nav>
  `,
  computed: {
    isLoggedIn() {
      return !!localStorage.getItem("token");
    }
  },
  methods: {
    logout() {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      this.$router.push("/login").then(() => {
        window.location.reload();
      });
    }
  }
};
