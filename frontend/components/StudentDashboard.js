const StudentDashboard = {
  components: { DashboardLayout },

  template: `
    <DashboardLayout title="Student Dashboard">

      <button @click="tab = 'profile'">Profile</button>
      <button @click="tab = 'drives'">Drives</button>
      <button @click="tab = 'applications'">Applications</button>

      <hr>

      <div v-if="tab === 'profile'">
        <h3>My Profile</h3>

        <form @submit.prevent="updateProfile">

          <input v-model="student.roll_number" placeholder="Roll Number">
          <br><br>

          <input v-model="student.branch" placeholder="Branch">
          <br><br>

          <input v-model="student.year" type="number" placeholder="Year">
          <br><br>

          <input v-model="student.cgpa" type="number" placeholder="CGPA">
          <br><br>

          <textarea v-model="student.skills" placeholder="Skills"></textarea>
          <br><br>

          <input type="file" @change="selectFile">
          <br><br>

          <button type="submit">Save Profile</button>

        </form>
      </div>


      <div v-if="tab === 'drives'">
        <h3>Placement Drives</h3>

        <div v-for="drive in drives" :key="drive.id">
          <h4>{{ drive.job_title }}</h4>

          <p>Company: {{ drive.company_name }}</p>
          <p>{{ drive.job_description }}</p>
          <p>Salary: {{ drive.salary_lpa }} LPA</p>
          <p>Deadline: {{ drive.application_deadline }}</p>

          <button v-if="!getApplication(drive.id)" @click="apply(drive.id)">Apply</button>
          <div v-else>
            <p><strong>Status:</strong> {{ getApplication(drive.id).status }}</p>
            <p v-if="getApplication(drive.id).interview_date">
              <strong>Interview Date:</strong> {{ new Date(getApplication(drive.id).interview_date).toLocaleString() }}
            </p>
          </div>

          <hr>

        </div>
      </div>


      <div v-if="tab === 'applications'">
        <h3>My Applications</h3>

        <div v-for="application in applications" :key="application.id">

          <h4>
            {{ application.job_title }} -
            {{ application.company_name }}
          </h4>

          <p>Status: {{ application.status }}</p>
          
          <p v-if="application.interview_date">
            <strong>Interview Date:</strong> {{ new Date(application.interview_date).toLocaleString() }}
          </p>

          <ul>
            <li v-for="log in application.logs">
              {{ log.status_from }} →
              {{ log.status_to }}
            </li>
          </ul>

          <hr>

        </div>
      </div>

    </DashboardLayout>
  `,

  data() {
    return {
      student: {},
      drives: [],
      applications: [],
      resume: null,
      tab: "drives"
    };
  },

  methods: {
    async getDashboard() {
      const response = await fetch(API + "/student/dashboard", {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") }
      });

      const data = await response.json();

      this.student = data.student;
      this.drives = data.drives;
      this.applications = data.applications;
    },

    getApplication(driveId) {
      return this.applications.find(app => app.drive_id === driveId);
    },


    selectFile(event) {
      this.resume = event.target.files[0];
    },

    async updateProfile() {
      const form = new FormData();

      form.append("roll_number", this.student.roll_number || "");
      form.append("branch", this.student.branch || "");
      form.append("year", this.student.year || "");
      form.append("cgpa", this.student.cgpa || "");
      form.append("skills", this.student.skills || "");

      if (this.resume) { form.append("resume", this.resume); }

      const response = await fetch(API + "/student/profile/update", {
        method: "POST",
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
        body: form
      });

      if (response.ok) { alert("Profile updated"); this.getDashboard(); }
    },


    async apply(driveId) {
      const response = await fetch(API + "/student/apply/" + driveId, {
        method: "POST",
        headers: { Authorization: "Bearer " + localStorage.getItem("token") }
      });

      if (response.ok) { alert("Applied successfully"); this.getDashboard(); }
      else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to apply");
      }
    }
  },

  mounted() {
    this.getDashboard();
  }
};

