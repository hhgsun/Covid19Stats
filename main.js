console.log('MAIN JS');

class CovidApiService {
  url = "https://api.covid19api.com/";

  async getCountries() {
    return await fetch(this.url + "countries")
      .then(response => response.text())
      .then(result => JSON.parse(result))
      .catch(error => console.log('error', error));
  }

  async getCountryData(countrySlug) {
    return await fetch(this.url + "total/dayone/country/" + countrySlug)
      .then(response => response.text())
      .then(result => JSON.parse(result))
      .catch(error => console.log('error', error));
  }
}

class UIController {
  constructor() {
    this.covidData = [];

    this.main = document.getElementById('main');
    this.selectBoxDurumlar = document.getElementById('selectbox_durumlar');
    this.selectBoxUlkeler = document.getElementById('selectbox_ulkeler');

    this.loadingBox = document.getElementById('loading');

    let self = this;
    this.selectBoxDurumlar.addEventListener('change', () => self.chartRender());
    this.selectBoxUlkeler.addEventListener('change', () => self.loadCovidData());

    this.covidApiService = new CovidApiService();
  }

  init() {
    this.loadingShow();
    this.setDurumlar();
    this.setUlkeler().then(() => this.loadCovidData());
  }

  setDurumlar() {
    this.durumlar = [
      ["Confirmed", "Onaylanmış"],
      ["Deaths", "Ölümler"],
      ["Recovered", "Kurtarılan"],
      ["Active", "Aktif"],
      ["Confirmed-Daily", "Onaylanmış-Günlük"],
      ["Deaths-Daily", "Ölümler-Günlük"],
      ["Recovered-Daily", "Kurtarılan-Günlük"],
      ["Active-Daily", "Aktif-Günlük"],
    ];
    this.durumlar.forEach(d => {
      let option = document.createElement('option');
      option.value = d[0];
      option.text = d[1];
      if (d[0] == "Confirmed-Daily") { //default selected
        option.selected = true;
      }
      this.selectBoxDurumlar.appendChild(option);
    });
  }

  async setUlkeler() {
    await this.covidApiService.getCountries().then(countries => {
      countries.sort((a, b) => (a['Slug'] > b['Slug']) ? 1 : -1);
      countries.forEach(country => {
        let option = document.createElement('option');
        option.value = country['Slug'];
        option.text = country['Country'];
        if (option.value == 'turkey') { //default selected
          option.selected = true;
        }
        this.selectBoxUlkeler.appendChild(option);
      });
    });
  }

  async loadCovidData() {
    this.loadingShow();
    this.main.innerHTML = '';
    let slug = this.selectBoxUlkeler.value;
    await this.covidApiService.getCountryData(slug)
      .then((data) => {
        this.covidData = data;
        this.chartRender();
        this.loadingHidden();
      });
  }

  loadingShow() {
    this.loadingBox.style.display = "block";
  }

  loadingHidden() {
    this.loadingBox.style.display = "none";
  }

  chartRender() {
    if(this.covidData == null || this.covidData == undefined || this.covidData.length < 1) {
      alert('Beklenmedik bir hata, seçilen ülkeye ait verilere ulaşılmamış olabilir.');
      return;
    }

    let selectedDurum = this.selectBoxDurumlar.value;

    let selectedDurumYazi = "";
    var durumlardanSecilen = this.durumlar.filter((v) => v[0] == selectedDurum);
    selectedDurumYazi = durumlardanSecilen[0][1];

    let listTarih = [];
    let listDeger = [];

    for (let i = this.covidData.length - 75; i < this.covidData.length; i++) {
      let deger = 0;
      switch (selectedDurum) {
        case "Confirmed":
          deger = this.covidData[i]['Confirmed'];
          break;
        case "Deaths":
          deger = this.covidData[i]['Deaths'];
          break;
        case "Recovered":
          deger = this.covidData[i]['Recovered'];
          break;
        case "Active":
          deger = this.covidData[i]['Active'];
          break;
        case "Confirmed-Daily":
          deger = this.covidData[i]['Confirmed'] - this.covidData[i - 1]['Confirmed'];
          break;
        case "Deaths-Daily":
          deger = this.covidData[i]['Deaths'] - this.covidData[i - 1]['Deaths'];
          break;
        case "Recovered-Daily":
          deger = this.covidData[i]['Recovered'] - this.covidData[i - 1]['Recovered'];
          break;
        case "Active-Daily":
          deger = this.covidData[i]['Active'] - this.covidData[i - 1]['Active'];
          break;
        default:
          break;
      }
      deger = deger < 0 ? deger * -1 : deger;
      let tarih = new Date(this.covidData[i]["Date"]);
      let formatTarih = moment(tarih).locale("tr").format('DD MMMM YYYY');
      listTarih.push(formatTarih);
      listDeger.push(deger);
    }

    let canvas = document.createElement('canvas');
    this.main.innerHTML = '';
    this.main.appendChild(canvas);

    let ctx = canvas.getContext('2d');
    let chart = new Chart(ctx, {
      // The type of chart we want to create
      type: 'line',
      // The data for our dataset
      data: {
        labels: listTarih,
        datasets: [{
          label: selectedDurumYazi,
          backgroundColor: 'pink',
          borderColor: 'red',
          data: listDeger
        }]
      },

      // Configuration options go here
      options: {}
    });

    this.loadingHidden();
  }

}

let uic = new UIController();
uic.init();
