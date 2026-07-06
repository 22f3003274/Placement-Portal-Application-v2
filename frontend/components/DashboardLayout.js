const DashboardLayout = {
  props: ["title"],

  template: `
    <div class="container mt-4">
      <h2>{{ title }}</h2>

      <p>
        Hello, {{ user.name }}
      </p>

      <button @click="logout"> Logout </button>

      <hr>

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

