const StudentDashboard = {
  components: { DashboardLayout },

  template: `
    <DashboardLayout title="Student Dashboard">

      <button @click="tab='profile'">Profile</button>
      <button @click="tab='drives'">Drives</button>
      <button @click="tab='applications'">Applications</button>

      <hr>

      <!-- Profile -->
      <div v-if="tab === 'profile'">

        <h3>Update Profile</h3>

        <form @submit.prevent="updateProfile">

          <div>
            <input
              v-model="profile.roll_number"
              placeholder="Roll Number">
          </div>

          <div>
            <input
              v-model="profile.branch"
              placeholder="Branch">
          </div>

          <div>
            <input
              type="number"
              v-model="profile.year"
              placeholder="Year">
          </div>

          <div>
            <input
              type="number"
              step="0.1"
              v-model="profile.cgpa"
              placeholder="CGPA">
          </div>

          <div>
            <textarea
              v-model="profile.skills"
              placeholder="Skills">
            </textarea>
          </div>

          <div>
            <input
              type="file"
              @change="onFileChange">
          </div>

          <button type="submit">
            Update Profile
          </button>

        </form>

        <div v-if="student.resume">
          <a
            :href="'http://127.0.0.1:5000/' + student.resume"
            target="_blank">
            View Resume
          </a>
        </div>

      </div>

      <!-- Drives -->
      <div v-if="tab === 'drives'">

        <h3>Available Drives</h3>

        <div
          v-for="drive in drives"
          :key="drive.id">

          <h4>
            {{ drive.job_title }}
            - {{ drive.company_name }}
          </h4>

          <p>{{ drive.job_description }}</p>

          <p>Salary: {{ drive.salary_lpa }} LPA</p>

          <p>
            Deadline:
            {{ drive.application_deadline }}
          </p>

          <button
            v-if="!hasApplied(drive.id)"
            @click="applyForDrive(drive.id)">

            Apply

          </button>

          <span v-else>
            Already Applied
          </span>

          <hr>

        </div>

      </div>

      <!-- Applications -->
      <div v-if="tab === 'applications'">

        <h3>My Applications</h3>

        <table border="1">

          <tr>
            <th>Job</th>
            <th>Company</th>
            <th>Status</th>
          </tr>

          <tr
            v-for="app in applications"
            :key="app.id">

            <td>{{ app.job_title }}</td>
            <td>{{ app.company_name }}</td>
            <td>{{ app.status }}</td>

          </tr>

        </table>

      </div>

    </DashboardLayout>
  `,

  data() {
    return {
      student: {},

      profile: {
        roll_number: "",
        branch: "",
        year: "",
        cgpa: "",
        skills: ""
      },

      resumeFile: null,
      drives: [],
      applications: [],
      tab: "drives"
    };
  },

  methods: {

    hasApplied(driveId) {
      return this.applications.some(
        app => app.drive_id === driveId
      );
    },

    onFileChange(event) {
      this.resumeFile = event.target.files[0];
    },

    async fetchDashboard() {

      const res = await fetch(
        API + "/student/dashboard",
        {
          headers: {
            Authorization:
              "Bearer " + userAuth.getTok()
          }
        }
      );

      if (res.ok) {

        const data = await res.json();

        this.student = data.student;
        this.drives = data.drives;
        this.applications = data.applications;

        this.profile.roll_number =
          data.student.roll_number || "";

        this.profile.branch =
          data.student.branch || "";

        this.profile.year =
          data.student.year || "";

        this.profile.cgpa =
          data.student.cgpa || "";

        this.profile.skills =
          data.student.skills || "";
      }
    },

    async updateProfile() {

      const formData = new FormData();

      formData.append(
        "roll_number",
        this.profile.roll_number
      );

      formData.append(
        "branch",
        this.profile.branch
      );

      formData.append(
        "year",
        this.profile.year
      );

      formData.append(
        "cgpa",
        this.profile.cgpa
      );

      formData.append(
        "skills",
        this.profile.skills
      );

      if (this.resumeFile) {
        formData.append(
          "resume",
          this.resumeFile
        );
      }

      const res = await fetch(
        API + "/student/profile/update",
        {
          method: "POST",
          headers: {
            Authorization:
              "Bearer " + userAuth.getTok()
          },
          body: formData
        }
      );

      if (res.ok) {
        alert("Profile updated");
        this.fetchDashboard();
      }
    },

    async applyForDrive(driveId) {

      const res = await fetch(
        API + "/student/apply/" + driveId,
        {
          method: "POST",
          headers: {
            Authorization:
              "Bearer " + userAuth.getTok()
          }
        }
      );

      if (res.ok) {
        alert("Application submitted");
        this.fetchDashboard();
      }
    }

  },

  mounted() {
    this.fetchDashboard();
  }
};