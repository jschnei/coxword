FROM ubuntu
RUN apt-get update
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y -q libevent-dev libpython-dev python-all python-pip
ADD ./requirements.txt /tmp/requirements.txt
RUN pip install -r /tmp/requirements.txt
ADD ./ /opt/
WORKDIR /opt/
EXPOSE 5000
CMD ["python", "run.py"]
