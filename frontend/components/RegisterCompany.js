const RegisterCompany = {
  template: `
    <div class="container mt-5">
        <div class="row justify-content-center">
            <div class="col-md-6">

                <div class="card shadow">
                    <div class="card-header bg-primary text-white text-center">
                        <h4 class="mb-0">Company Registration</h4>
                    </div>

                    <div class="card-body">

                        <div v-if="error" class="alert alert-danger">
                            {{ error }}
                        </div>

                        <form @submit.prevent="register">

                            <div class="mb-3">
                                <label class="form-label">Contact Name</label>
                                <input v-model="name" type="text" class="form-control" placeholder="Contact Name" required>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Company Name</label>
                                <input v-model="companyName" type="text" class="form-control" placeholder="Company Name" required>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Email</label>
                                <input v-model="email" type="email" class="form-control" placeholder="Email" required>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Password</label>
                                <input v-model="password" type="password" class="form-control" placeholder="Password" required>
                            </div>

                            <button type="submit" class="btn btn-primary w-100">Register</button>

                        </form>

                        <div class="mt-4 text-center">
                            <p>
                                <a href="#/login">Back to Login</a>
                            </p>
                        </div>

                    </div>
                </div>

            </div>
        </div>
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

