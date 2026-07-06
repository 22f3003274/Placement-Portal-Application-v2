const RegisterStudent = {
  template: `
    <div class="container mt-5">
      <h2>Student Registration</h2>

      <form @submit.prevent="register">
        <input v-model="name" type="text" placeholder="Name" required >
        <br><br>

        <input v-model="email" type="email" placeholder="Email" required>
        <br><br>

        <input v-model="password" type="password" placeholder="Password" required>
        <br><br>

        <button type="submit">Register</button>

      </form>

      <p v-if="error">{{ error }}</p>

      <p>
        <a href="#/login">Back to Login</a>
      </p>

    </div>
  `,

  data() {
    return {
      name: "",
      email: "",
      password: "",
      error: ""
    };
  },

  methods: {
    async register() {
      const response = await fetch(API + "/auth/register/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: this.name,
          email: this.email,
          password: this.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert("Registration successful");
        this.$router.push("/login");
      }
      else {
        this.error = data.error;
      }
    }
  }
};

