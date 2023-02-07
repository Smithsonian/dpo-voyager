


# Initialization

## Create the first user

As long as no user exist, the application launches in "open" mode. An unauthenticated request can be used to create the first user : 

```
curl -XPOST -H "Content-Type: application/json" -d '{"username":"<...>", "password":"<...>", "isAdministrator": true}' "http://<hostname>:<port>/api/v1/users"
```

Then restart the application to enable permissions management

## Deployment

Local (testing): *from the project's root*

    npm run build-server
    npm start

Deployment: 

    docker buid . -t ethesaurus
    docker run --rm -it --port 8000:8000 --volume "$(pwd)/files:/app/files" --name ethesaurus ethesaurus
