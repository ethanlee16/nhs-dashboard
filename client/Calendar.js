import React from 'react';
import _ from 'lodash';
import { Modal, Col, Button } from 'react-bootstrap';

var $ = require('jquery');
var fullCalendar = require('fullcalendar');

class Calendar extends React.Component {
    constructor(props) {
      super(props);
      this.close = ::this.close;
      this.save = ::this.save;
      this.remove = ::this.remove;
      this.selectDay = ::this.selectDay;
      this.state = {
        selecting: false
      }
    }

    componentDidMount() {
      window.onbeforeunload = () => {
        this.remove();
      }

      $('#calendar').fullCalendar({
        weekends: false,
        dayClick: this.selectDay,
        dayRender: (date, cell) => {
          var day = date.day();
          var month = $('#calendar').fullCalendar('getDate').month();
          if ((day === 2 || day === 4) 
              && month === date.month()) {
            cell.css('background-color', 'lightyellow');
          } else {
            cell.css('cursor', 'not-allowed');
          }
        }
      });
    }

    componentWillReceiveProps(nextProps) {
      if (nextProps.db) {
        nextProps.db.ref('bookings').on('value', snapshot => {
          var bookings = _.mapValues(snapshot.val(), v => _.values(v));
          this.setState({ bookings })

          var source = [];
          _.keys(bookings).forEach(k => {
            bookings[k].forEach(v => {
              source.push({
                start: k,
                title: v.substring(0, v.indexOf('@'))
                        .split('.').join(' ')
              })
            })
          })
          // console.log(JSON.stringify(source))

          $('#calendar').fullCalendar('removeEventSources');
          $('#calendar').fullCalendar('addEventSource', source);
        });
      }
    }

    selectDay(date, event, view) {
      if (date.day() !== 2 && date.day() !== 4) return;

      this.props.db.ref('bookings/' + date.format()).push(localStorage.email);
      this.setState({
        selecting: true,
        date: date
      });
    }

    remove() {
      this.props.db
      .ref('bookings/' + this.state.date.format())
      .transaction(bookings => {
        for (var tutor in bookings) {
          if (bookings[tutor] === localStorage.email) {
            delete bookings[tutor];
          }
        }
        return bookings;
      });
    }

    close() {
      this.remove();
      this.setState({selecting: false}); 
    }

    save() {
      this.setState({selecting: false, date: null});
    }

    render() {
      if (this.state.date)
      var date = this.state.date.format('dddd, MMMM Do')
      return (
        <Col md={8}>
          <div id="calendar" style={{textTransform: 'capitalize'}}>
          </div>
          <Modal show={this.state.selecting} onHide={this.close}>
            <Modal.Header closeButton>
              <Modal.Title>{date}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p>You are now confirming your NHS tutoring session 
              for <b>{date}</b>, from 2:05-3:00 PM.</p>
              <p>Would you like to save this date?</p>
            </Modal.Body>
            <Modal.Footer>
              <Button onClick={this.close}>Cancel</Button>
              <Button bsStyle="primary" onClick={this.save}>Confirm</Button>
            </Modal.Footer>
        </Modal>
        </Col>
      );
    }
}

export default Calendar;