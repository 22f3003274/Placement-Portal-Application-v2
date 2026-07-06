const Login = {
  template: `
    <div class="container mt-5">
      <h2>Login</h2>

      <form @submit.prevent="login">
        <input v-model="email" type="email" placeholder="Email" required >
        <br><br>

        <input v-model="password" type="password" placeholder="Password" required >
        <br><br>

        <button type="submit">Login</button>

      </form>

      <p v-if="error">{{ error }}</p>

      <hr>

      <a href="#/register-student">Student Registration</a>
      <br>
      <a href="#/register-company">Company Registration</a>

    </div>
  `,

  data() {
    return {
      email: "",
      password: "",
      error: ""
    };
  },

  methods: {
    async login() {
      const response = await fetch(API + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: this.email,
          password: this.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("user", JSON.stringify(data.user));
        this.$router.push("/" + data.user.role + "/dashboard");
      }
      else {
        this.error = data.error;
      }
    }
  }
};
