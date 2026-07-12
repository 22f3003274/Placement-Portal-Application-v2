const Login = {
  template: `
    <div class="container mt-5">
        <div class="row justify-content-center">
            <div class="col-md-6">

                <div class="card shadow">
                    <div class="card-header bg-primary text-white text-center">
                        <h4 class="mb-0">Login</h4>
                    </div>

                    <div class="card-body">
                    
                        <div v-if="error" class="alert alert-danger">
                            {{ error }}
                        </div>

                        <form @submit.prevent="login">

                            <div class="mb-3">
                                <label class="form-label">Email</label>
                                <input type="email" class="form-control" v-model="email" placeholder="Email" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Password</label>
                                <input type="password" class="form-control" v-model="password" placeholder="Password" required>
                            </div>

                            <button type="submit" class="btn btn-primary w-100">Login</button>

                        </form>

                        <div class="mt-4 text-center">
                            <p>Are you a new user? Register below:</p>
                            <p>
                                <a href="#/register-company">Register as Company</a>
                            </p>
                            <p>
                                <a href="#/register-student">Register as Student</a>
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
        this.$router.push("/" + data.user.role + "/dashboard").then(() => {
          window.location.reload();
        });
      }
      else {
        this.error = data.error;
      }
    }
  }
};
