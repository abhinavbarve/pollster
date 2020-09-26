$(document).ready(() => {
    async function getData() {

        await fetch('http://localhost:8080/database/database190310392199/pollData')
            .then(response => {
                response.json().then((result) => {
                    let poll_data = result[0]
                    console.log(poll_data.options.map((each) => { return each.score }))

                    let ctx = document.getElementById('result-chart').getContext('2d');
                    let resultchart = new Chart(ctx, {
                        type: 'doughnut',
                        data: {
                            labels: poll_data.options.map((each) => { return each.name }),
                            datasets: [{
                                label: '# of Votes',
                                data: poll_data.options.map((each) => { return each.score }),
                                backgroundColor: poll_data.options.map((each) => { return each.color }),
                                borderColor: [
                                    // 'rgba(255, 99, 132, 1)',
                                    // 'rgba(54, 162, 235, 1)',
                                    // 'rgba(255, 206, 86, 1)',
                                    // 'rgba(75, 192, 192, 1)',
                                    // 'rgba(153, 102, 255, 1)',
                                    // 'rgba(255, 159, 64, 1)'


                                ],
                                borderWidth: 1
                            }]
                        }
                    });
                })
            })

    }

    getData()
});  