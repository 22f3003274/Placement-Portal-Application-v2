const RegisterCompany = {
  template: `
    <div class="container mt-5">
      <h2>Company Registration</h2>

      <form @submit.prevent="register">

        <input v-model="name" type="text" placeholder="Contact Name" required >
        <br><br>

        <input v-model="companyName" type="text" placeholder="Company Name" required >
        <br><br>

        <input v-model="email" type="email" placeholder="Email" required >
        <br><br>

        <input v-model="password" type="password" placeholder="Password" required >
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
      companyName: "",
      email: "",
      password: "",
      error: ""
    };
  },

  methods: {
    async register() {
      const response = await fetch(API + "/auth/register/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: this.name,
          company_name: this.companyName,
          email: this.email,
          password: this.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert("Registration successful. Wait for admin approval.");
        this.$router.push("/login");
      }
      else {
        this.error = data.error;
      }
    }
  }
};

