const studentDashboardTemplate = `
    <DashboardLayout title="Student Dashboard">

      <button @click="tab = 'profile'">Profile</button>
      <button @click="tab = 'drives'">Drives</button>
      <button @click="tab = 'applications'">Applications</button>

      <hr>

      <div v-if="tab === 'profile'">
        <h3>My Profile</h3>
        <button @click="exportHistory" style="margin-bottom: 15px;">Export Application History (CSV)</button>

        <form @submit.prevent="updateProfile">

          <input v-model="student.roll_number" placeholder="Roll Number">
          <br><br>

          <input v-model="student.branch" placeholder="Branch">
          <br><br>

          <input v-model="student.year" type="number" placeholder="Year">
          <br><br>

          <input v-model="student.cgpa" type="number" step="0.01" placeholder="CGPA">
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
              <strong>Interview Date:</strong> {{ new Date(getApplication(drive.id).interview_date).toLocaleString('en-GB') }}
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
            <strong>Interview Date:</strong> {{ new Date(application.interview_date).toLocaleString('en-GB') }}
          </p>

          <p>
            <strong>History: </strong> {{ formatHistory(application.logs) }}
          </p>

          <hr>

        </div>
      </div>

    </DashboardLayout>
  `;
