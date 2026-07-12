const DashboardLayout = {
  props: ["title"],

  template: `
    <div class="container mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>{{ title }}</h2>
        <span class="text-muted">Welcome, <strong>{{ user.name }}</strong></span>
      </div>

      <slot></slot>

    </div>
  `,

  data() {
    return {
      user: JSON.parse(localStorage.getItem("user"))
    };
  },

  methods: {
    logout() {
      localStorage.clear();

      this.$router.push("/login");
    }
  }
};

